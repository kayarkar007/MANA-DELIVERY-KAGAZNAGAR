"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
    Activity,
    CheckCircle,
    Coffee,
    Loader2,
    LogOut,
    MapPin,
    Package,
    Power,
    PowerOff,
    RotateCcw,
    Truck,
    Wallet,
    WifiOff,
    XCircle,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import NotificationBell from "@/components/NotificationBell";
import {
    getOrderItemSummary,
    getOrderMetaLabel,
    getPrimaryOrderImage,
} from "@/lib/orderPresentation";

const DUTY_STORAGE_KEY = "localu-rider-duty-active";

export default function RiderDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [isSharingLocation, setIsSharingLocation] = useState(false);
    const [hasResolvedDutyState, setHasResolvedDutyState] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [deliveryPinInputs, setDeliveryPinInputs] = useState<Record<string, string>>({});
    const [statsData, setStatsData] = useState({
        completedToday: 0,
        earningsToday: 0,
        totalEarnings: 0,
        totalCompleted: 0,
    });
    const [shiftInfo, setShiftInfo] = useState<{
        activeShift: any;
        shifts: any[];
        payouts: any[];
        rider: any;
    }>({
        activeShift: null,
        shifts: [],
        payouts: [],
        rider: null,
    });
    const [shiftLoading, setShiftLoading] = useState(false);

    const watchIdRef = useRef<number | null>(null);
    const lastOrderIdsRef = useRef<Set<string>>(new Set());
    const isFetchingRef = useRef(false);

    const playNotificationSound = () => {
        try {
            const audio = new Audio("/notification.mp3");
            audio.play().catch(() => {});
        } catch (error) {
            console.error("Audio play failed:", error);
        }
    };

    const persistDutyPreference = (active: boolean) => {
        if (typeof window === "undefined") return;
        localStorage.setItem(DUTY_STORAGE_KEY, active ? "true" : "false");
    };

    const fetchOrders = async (silent = false) => {
        if (isFetchingRef.current) return;

        isFetchingRef.current = true;
        if (!silent) setLoading(true);
        else setRefreshing(true);

        try {
            const res = await fetch("/api/rider/orders?stats=true");
            const data = await res.json();

            if (data.success && data.data) {
                const currentOrderIds = new Set<string>(data.data.map((order: any) => order._id as string));
                const newOrders = data.data.filter((order: any) => !lastOrderIdsRef.current.has(order._id));

                if (newOrders.length > 0 && lastOrderIdsRef.current.size > 0) {
                    playNotificationSound();
                    toast.info("New order assigned!", {
                        description: `Order #${newOrders[0]._id.slice(-6).toUpperCase()} needs attention.`,
                        duration: 10000,
                    });
                }

                setOrders(data.data);
                setStatsData(data.stats);
                lastOrderIdsRef.current = currentOrderIds;
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
            if (!silent) toast.error("Could not load orders. Check your connection.");
        } finally {
            setLoading(false);
            setRefreshing(false);
            isFetchingRef.current = false;
        }
    };

    const fetchShiftInfo = async () => {
        try {
            const res = await fetch("/api/rider/shift");
            const data = await res.json();
            if (data.success) {
                setShiftInfo(data.data);
            }
        } catch (error) {
            console.error("Error fetching shift info:", error);
        }
    };

    const handleShiftAction = async (action: "start" | "break_start" | "break_end" | "end") => {
        if (!navigator.onLine) {
            toast.error("You're offline. Reconnect before changing your shift.");
            return;
        }

        setShiftLoading(true);
        try {
            const res = await fetch("/api/rider/shift", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || "Failed to update shift");
            }

            await fetchShiftInfo();
            if (action === "start") {
                toast.success("Shift started");
            } else if (action === "end") {
                toast.success("Shift ended");
            } else if (action === "break_start") {
                toast.success("Break started");
            } else {
                toast.success("Back on duty");
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update shift");
        } finally {
            setShiftLoading(false);
        }
    };

    const stopLocationSharing = async (silent = false) => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        setIsSharingLocation(false);
        persistDutyPreference(false);

        try {
            await fetch("/api/rider/location", { method: "DELETE" });
        } catch {
            // Best-effort only.
        }

        fetch("/api/rider/shift", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "end" }),
        }).then(() => fetchShiftInfo()).catch(() => {});

        if (!silent) {
            toast.info("Location sharing stopped");
        }
    };

    const startLocationSharing = (silent = false) => {
        if (watchIdRef.current !== null) {
            setIsSharingLocation(true);
            setHasResolvedDutyState(true);
            persistDutyPreference(true);
            return;
        }

        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            setHasResolvedDutyState(true);
            return;
        }

        setIsSharingLocation(true);
        setHasResolvedDutyState(true);
        persistDutyPreference(true);

        const id = navigator.geolocation.watchPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    await fetch("/api/rider/location", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ latitude, longitude }),
                    });
                } catch (error) {
                    console.error("Error updating location:", error);
                }
            },
            async (error) => {
                let message = "Failed to get location.";
                const isHardError = error.code === error.PERMISSION_DENIED;

                if (error.code === error.PERMISSION_DENIED) {
                    message = "Location permission denied. Please allow GPS to continue duty.";
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    message = "Location is unavailable. Check your device GPS settings.";
                } else if (error.code === error.TIMEOUT) {
                    message = "Location request timed out. Reconnecting...";
                }

                toast.error(message, { id: "geo-error" });

                if (isHardError) {
                    await stopLocationSharing(true);
                }
            },
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );

        watchIdRef.current = id;

        if (!silent) {
            toast.success("Duty started. Location sharing is active.");
        }

        fetch("/api/rider/shift", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "start" }),
        }).then(() => fetchShiftInfo()).catch(() => {});
    };

    const updateOrderStatus = async (orderId: string, deliveryStatus: string, deliveryOtp?: string) => {
        if (!navigator.onLine) {
            toast.error("You're offline. Reconnect before updating delivery status.");
            return;
        }

        try {
            const res = await fetch("/api/rider/orders", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, deliveryStatus, deliveryOtp }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`Status updated to ${deliveryStatus.replace(/_/g, " ")}`);
                fetchOrders();
            } else {
                toast.error(data.error || "Failed to update status");
            }
        } catch {
            toast.error("An error occurred");
        }
    };

    useEffect(() => {
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            if (localStorage.getItem(DUTY_STORAGE_KEY) === "true" && watchIdRef.current === null) {
                startLocationSharing(true);
            }
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user.role !== "rider") return;

        let isMounted = true;

        const bootstrapDutyState = async () => {
            try {
                const res = await fetch("/api/rider/location");
                const data = await res.json();
                await fetchShiftInfo();
                const shouldResume =
                    localStorage.getItem(DUTY_STORAGE_KEY) === "true" || Boolean(data?.data?.isOnDuty);

                if (isMounted && shouldResume) {
                    startLocationSharing(true);
                }
            } catch {
                // Allow manual retry from the UI.
            } finally {
                if (isMounted) {
                    setHasResolvedDutyState(true);
                }
            }
        };

        bootstrapDutyState();
        fetchOrders();
        const notificationStream = new EventSource("/api/notifications/stream");
        notificationStream.onmessage = () => {
            fetchOrders(true);
        };
        notificationStream.onerror = () => {
            // Fallback interval below keeps the dashboard fresh.
        };

        const tick = () => {
            if (document.visibilityState === "visible") {
                fetchOrders(true);
            }
        };

        const interval = setInterval(tick, 25000);
        document.addEventListener("visibilitychange", tick);
        return () => {
            isMounted = false;
            notificationStream.close();
            clearInterval(interval);
            document.removeEventListener("visibilitychange", tick);

            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [session?.user.role]);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (
                document.visibilityState === "visible" &&
                localStorage.getItem(DUTY_STORAGE_KEY) === "true" &&
                watchIdRef.current === null
            ) {
                startLocationSharing(true);
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, []);

    if (status === "loading") {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-red-100 dark:border-red-900/30">
                    <Image src="/logo2.png" alt="Mana Delivery" width={56} height={56} className="object-contain" />
                </div>
                <Loader2 className="w-7 h-7 animate-spin text-red-600" />
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Loading Rider Panel...</p>
            </div>
        );
    }

    if (loading && orders.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <div className="h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
                    <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-3xl animate-pulse" />
                </div>
                {[1, 2].map((index) => (
                    <div key={index} className="h-64 bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 h-14 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src="/logo2.png" alt="Mana Delivery" width={28} height={28} className="object-contain" />
                    </div>
                    <div>
                        <span className="font-black text-gray-900 dark:text-white text-base leading-none">Mana Delivery</span>
                        <span className="block text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none">Rider Panel</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isOnline ? "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20" : "text-red-600 bg-red-50"}`}>
                        {isOnline ? "Online" : "Offline"}
                    </span>
                    <NotificationBell />
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6 pb-8">
                {!isOnline && (
                    <div className="bg-red-600 text-white text-center py-2 px-4 rounded-xl mb-6 flex items-center justify-center gap-2 animate-bounce">
                        <WifiOff className="w-4 h-4" />
                        <span className="text-sm font-bold">You are currently offline. Data may be outdated.</span>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                            Dashboard
                            <button
                                onClick={() => fetchOrders()}
                                disabled={refreshing}
                                className={`p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition ${refreshing ? "animate-spin" : ""}`}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </button>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Welcome back, {session?.user.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {isSharingLocation
                                ? "Duty stays active and auto-resumes after app reopen."
                                : "Turn on duty to keep your live location synced."}
                        </p>
                    </div>

                    <button
                        onClick={() => (isSharingLocation ? stopLocationSharing() : startLocationSharing())}
                        disabled={!hasResolvedDutyState}
                        className={`w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-4 rounded-3xl font-black transition-all shadow-lg disabled:opacity-60 ${
                            isSharingLocation
                                ? "bg-red-50 text-red-600 border-2 border-red-100 dark:bg-red-900/10 dark:border-red-900/30"
                                : "bg-green-50 text-green-600 border-2 border-green-100 dark:bg-green-900/10 dark:border-green-900/30"
                        }`}
                    >
                        {!hasResolvedDutyState ? (
                            <><Loader2 className="w-6 h-6 animate-spin" /> Checking Duty</>
                        ) : isSharingLocation ? (
                            <><PowerOff className="w-6 h-6" /> Stop Duty</>
                        ) : (
                            <><Power className="w-6 h-6" /> Start Duty</>
                        )}
                    </button>
                </div>

                <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm mb-8 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Shift Control</p>
                            <p className="text-lg font-black text-gray-900 dark:text-white">
                                {shiftInfo.activeShift
                                    ? shiftInfo.activeShift.status === "on_break"
                                        ? "On Break"
                                        : "Shift Active"
                                    : "No Active Shift"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Total break today: {shiftInfo.activeShift?.breakMinutes || shiftInfo.rider?.totalBreakMinutes || 0} mins
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {shiftInfo.activeShift ? (
                                <>
                                    {shiftInfo.activeShift.status === "on_break" ? (
                                        <button
                                            onClick={() => handleShiftAction("break_end")}
                                            disabled={shiftLoading}
                                            className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 font-black text-sm disabled:opacity-50"
                                        >
                                            Resume Shift
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleShiftAction("break_start")}
                                            disabled={shiftLoading || !isSharingLocation}
                                            className="px-4 py-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 font-black text-sm disabled:opacity-50 inline-flex items-center gap-2"
                                        >
                                            <Coffee className="w-4 h-4" /> Start Break
                                        </button>
                                    )}
                                </>
                            ) : (
                                <button
                                    onClick={() => handleShiftAction("start")}
                                    disabled={shiftLoading || !isSharingLocation}
                                    className="px-4 py-3 rounded-2xl bg-red-50 text-red-600 border border-red-100 font-black text-sm disabled:opacity-50"
                                >
                                    Start Shift
                                </button>
                            )}
                            <button
                                onClick={() => handleShiftAction("end")}
                                disabled={shiftLoading || !shiftInfo.activeShift}
                                className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-black text-sm disabled:opacity-50"
                            >
                                End Shift
                            </button>
                        </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Recent Shifts</p>
                            {shiftInfo.shifts?.length ? (
                                shiftInfo.shifts.slice(0, 3).map((shift: any) => (
                                    <div key={shift._id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700">
                                        <span className="font-bold text-gray-700 dark:text-gray-200">
                                            {new Date(shift.startedAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {shift.status} · {shift.breakMinutes || 0}m break
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No shift history yet.</p>
                            )}
                        </div>
                        <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/60 p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Payout History</p>
                            {shiftInfo.payouts?.length ? (
                                shiftInfo.payouts.slice(0, 3).map((payout: any) => (
                                    <div key={payout._id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-700">
                                        <span className="font-bold text-gray-700 dark:text-gray-200 inline-flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-emerald-600" /> Rs {Number(payout.amount).toFixed(0)}
                                        </span>
                                        <span className="text-gray-500 dark:text-gray-400">{payout.status}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No payouts recorded yet.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Active Tasks</p>
                        <p className="text-4xl font-black text-red-600 tracking-tighter">{orders.length}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Completed Today</p>
                        <p className="text-4xl font-black text-emerald-600 tracking-tighter">{statsData.completedToday}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Earned Today</p>
                        <p className="text-4xl font-black text-purple-600 tracking-tighter"><span className="text-xl mr-1">Rs</span>{statsData.earningsToday}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500 to-red-600 p-5 rounded-3xl shadow-lg shadow-red-500/20 text-white">
                        <p className="text-[10px] font-black text-red-100 uppercase tracking-widest mb-2">Total Earned</p>
                        <p className="text-4xl font-black tracking-tighter"><span className="text-xl mr-1 font-sans text-red-200">Rs</span>{statsData.totalEarnings}</p>
                    </div>
                </div>

                <div className="grid gap-6">
                    {orders.length === 0 ? (
                        <div className="bg-white dark:bg-gray-900 rounded-[3rem] p-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-full mb-6">
                                <Activity className="w-12 h-12 text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No active assignments</h3>
                            <p className="text-gray-500 max-w-xs mx-auto">Assignments will appear here automatically when admin links you to an order.</p>
                            <button onClick={() => fetchOrders()} className="mt-8 text-red-600 font-bold flex items-center gap-2 hover:underline">
                                <RotateCcw className="w-4 h-4" /> Refresh Status
                            </button>
                        </div>
                    ) : (
                        orders.map((order) => {
                            const isNew = order.deliveryStatus === "assigned";
                            const orderImage = getPrimaryOrderImage(order);
                            const orderSummary = getOrderItemSummary(order);
                            const orderMeta = getOrderMetaLabel(order);

                            return (
                                <div
                                    key={order._id}
                                    className={`bg-white dark:bg-gray-900 rounded-[2.5rem] p-6 shadow-xl border overflow-hidden relative ${
                                        isNew ? "border-red-500 ring-4 ring-red-500/10" : "border-gray-100 dark:border-gray-800"
                                    }`}
                                >
                                    {isNew && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse" />}
                                    <div className="absolute top-0 right-0 p-6">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                                            order.deliveryStatus === "delivered"
                                                ? "bg-green-100 text-green-700"
                                                : order.deliveryStatus === "assigned"
                                                    ? "bg-red-600 text-white animate-bounce"
                                                    : order.deliveryStatus === "accepted"
                                                        ? "bg-red-100 text-red-700"
                                                        : order.deliveryStatus === "pending"
                                                            ? "bg-yellow-100 text-yellow-700"
                                                            : "bg-red-100 text-red-700"
                                        }`}>
                                            {order.deliveryStatus.replace(/_/g, " ")}
                                        </span>
                                    </div>

                                    <div className="mb-6 pr-24">
                                        <div className="flex items-start gap-4">
                                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                                                {orderImage ? (
                                                    <Image src={orderImage} alt={orderSummary} fill sizes="64px" className="object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-red-500 font-black text-xs px-2 text-center">
                                                        {order.type === "service" ? "SERVICE" : "ORDER"}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-red-600 uppercase mb-1">Order #{order._id.slice(-6).toUpperCase()}</p>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{order.customerName}</h3>
                                                <p className="text-gray-500 text-sm">{order.customerPhone}</p>
                                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mt-2 line-clamp-2">{orderSummary}</p>
                                                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide">{orderMeta}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex gap-3">
                                            <div className="mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                                                <MapPin className="w-5 h-5 text-red-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">Delivery Address</p>
                                                <p className="text-gray-900 dark:text-gray-100 font-medium">{order.address}</p>
                                                <a
                                                    href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                                    target="_blank"
                                                    className="text-red-600 text-xs font-bold hover:underline mt-1 inline-block"
                                                >
                                                    Open in Google Maps
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className="mt-1 bg-gray-50 dark:bg-gray-800 p-2 rounded-xl">
                                                <Package className="w-5 h-5 text-purple-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">Items</p>
                                                <p className="text-gray-900 dark:text-gray-100 font-medium">{orderSummary}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                                        {order.deliveryStatus === "assigned" ? (
                                            <>
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, "accepted")}
                                                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-600 hover:bg-red-700 transition-all text-white font-black text-sm"
                                                >
                                                    <CheckCircle className="w-5 h-5" /> Accept Order
                                                </button>
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, "declined")}
                                                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 font-black text-sm transition-all"
                                                >
                                                    <XCircle className="w-5 h-5" /> Decline
                                                </button>
                                            </>
                                        ) : order.deliveryStatus === "declined" ? (
                                            <div className="col-span-full bg-red-50 dark:bg-red-900/10 rounded-2xl p-4 text-center">
                                                <p className="text-red-600 dark:text-red-400 font-bold text-sm">You declined this order. Admin can reassign it.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, "picked_up")}
                                                    disabled={order.deliveryStatus !== "accepted"}
                                                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all border border-transparent hover:border-red-200 disabled:opacity-40 font-black text-sm"
                                                >
                                                    <Package className="w-5 h-5 text-red-500" /> Picked Up
                                                </button>
                                                <button
                                                    onClick={() => updateOrderStatus(order._id, "out_for_delivery")}
                                                    disabled={order.deliveryStatus !== "picked_up"}
                                                    className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-all border border-transparent hover:border-orange-200 disabled:opacity-40 font-black text-sm"
                                                >
                                                    <Truck className="w-5 h-5 text-orange-500" /> Out for Delivery
                                                </button>

                                                {order.deliveryStatus === "out_for_delivery" ? (
                                                    <div className="sm:col-span-2 mt-2 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                                        <label className="block text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">
                                                            Ask customer for 4-digit delivery PIN
                                                        </label>
                                                        <div className="flex flex-col sm:flex-row gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="----"
                                                                maxLength={4}
                                                                value={deliveryPinInputs[order._id] || ""}
                                                                onChange={(event) =>
                                                                    setDeliveryPinInputs((prev) => ({
                                                                        ...prev,
                                                                        [order._id]: event.target.value.replace(/\D/g, ""),
                                                                    }))
                                                                }
                                                                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-center text-2xl font-black tracking-[0.5em] outline-none focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 transition-all"
                                                            />
                                                            <button
                                                                onClick={() => updateOrderStatus(order._id, "delivered", deliveryPinInputs[order._id])}
                                                                disabled={!deliveryPinInputs[order._id] || deliveryPinInputs[order._id].length !== 4}
                                                                className="px-8 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-all font-black text-sm shadow-xl shadow-green-500/30 disabled:opacity-40 flex items-center justify-center gap-2"
                                                            >
                                                                <CheckCircle className="w-5 h-5" /> Verify & Deliver
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        disabled
                                                        className="sm:col-span-2 flex items-center justify-center gap-3 py-4 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-700/50 dark:text-green-400/50 font-black text-sm opacity-50 cursor-not-allowed"
                                                    >
                                                        <CheckCircle className="w-5 h-5" /> Mark Delivered
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

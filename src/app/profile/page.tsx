"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, Package, LogOut, Loader2, ArrowLeft, CheckCircle2, Truck, Clock, Wallet, Star, Heart, Navigation, ChevronRight, ShieldAlert, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";
import { getOrderItemSummary, getOrderMetaLabel, getPrimaryOrderImage } from "@/lib/orderPresentation";
import { formatCurrency } from "@/lib/utils";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [reviewOrder, setReviewOrder] = useState<string | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

    // Address Book State
    const [managingAddresses, setManagingAddresses] = useState(false);
    const [newAddressForm, setNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: "Home", address: "", lat: 17.3850, lng: 78.4867 });
    const [addressLocating, setAddressLocating] = useState(false);

    const openSupportForOrder = (orderId: string) => {
        const supportPhone = "919494378247";
        const shortOrderId = orderId.slice(-6).toUpperCase();
        const message = encodeURIComponent(`Hi, I need help with order #${shortOrderId}.`);
        window.open(`https://wa.me/${supportPhone}?text=${message}`, "_blank");
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            // Fetch User Details
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setProfile(data.data);
                    }
                });

            // Fetch User Orders
            fetch(`/api/orders?userId=${session.user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setOrders(data.data);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));

            fetch("/api/reviews/user")
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setReviews(data.data);
                    }
                });
        }
    }, [status, session, router]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: reviewOrder, rating, comment })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Review submitted successfully!");
                setReviews([...reviews, data.data]);
                setReviewOrder(null);
                setRating(5);
                setComment("");
            } else {
                toast.error(data.error || "Failed to submit review");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        setCancellingOrder(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "cancelled", deliveryStatus: "cancelled" } : o));
                toast.success("Order cancelled successfully.");
            } else {
                toast.error(data.error || "Failed to cancel order.");
            }
        } catch {
            toast.error("Error cancelling order.");
        } finally {
            setCancellingOrder(null);
        }
    };

    const handleLocateAddress = () => {
        setAddressLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data?.display_name) {
                        setNewAddress({ ...newAddress, address: data.display_name, lat: latitude, lng: longitude });
                        toast.success("Location found!");
                    }
                } finally {
                    setAddressLocating(false);
                }
            },
            () => {
                toast.error("Location access denied.");
                setAddressLocating(false);
            }
        );
    };

    const handleAddAddress = async () => {
        if (!newAddress.address) return toast.error("Please enter an address");
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "ADD_ADDRESS", addressData: newAddress })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setNewAddressForm(false);
                setNewAddress({ label: "Home", address: "", lat: 17.3850, lng: 78.4867 });
                toast.success("Address added safely!");
            }
        } catch { toast.error("Error adding address"); }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "DELETE_ADDRESS", addressId: id })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                toast.success("Address removed.");
            }
        } catch { toast.error("Error removing address"); }
    };

    const handleSetDefaultAddress = async (addr: any) => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SET_DEFAULT", addressData: addr })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                toast.success("Default address updated!");
            }
        } catch { toast.error("Error updating default address"); }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="app-card animate-pulse p-4 sm:p-6">
                    <img src="/logo2.png" alt="Loading Mana Delivery..." className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="py-2 sm:py-6 md:py-10">
            <div className="max-w-6xl mx-auto">
                <Link href="/" className="app-button app-button-secondary mb-6 w-fit rounded-[1.1rem] sm:mb-8">
                    <ArrowLeft className="w-4 h-4" /> Back to Store
                </Link>

                <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">

                    {/* Sidebar / Profile Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-1/3"
                    >
                        <div className="glass-card rounded-[2.2rem] p-6 text-center lg:sticky lg:top-24 lg:rounded-[3rem] lg:p-10">
                            <div className="relative inline-block mb-6">
                                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--accent)] text-4xl font-black text-white shadow-2xl shadow-red-500/30 sm:h-32 sm:w-32 sm:text-5xl">
                                    {session?.user?.name?.charAt(0)}
                                </div>
                                <div className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-2xl border-4 border-white bg-emerald-500 shadow-lg dark:border-slate-900 sm:h-10 sm:w-10">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            
                            <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white sm:text-3xl">{session?.user?.name}</h2>
                            <p className="mb-6 mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 sm:mb-8">{session?.user?.email}</p>

                            <div className="space-y-4 text-left">
                                <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-5 transition-colors dark:border-slate-800/50 dark:bg-slate-900/50 sm:p-6">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="bg-red-600 text-white p-2.5 rounded-2xl">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mana Wallet</p>
                                    </div>
                                    <p className="text-2xl font-black leading-none text-slate-900 dark:text-white sm:text-3xl">
                                        <span className="text-gradient">{formatCurrency(Number(profile?.walletBalance) || 0)}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Phone className="w-3 h-3" /> WhatsApp
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {profile?.whatsapp || "NOT LINKED"}
                                        </p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-rose-500/10 shadow-lg shadow-rose-500/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-linear-to-r from-red-600/10 to-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                                            <ShieldAlert className="w-3 h-3" /> 24/7 Support Desk
                                        </p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight relative z-10">
                                            +91 9494378247
                                        </p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <MapPin className="w-3 h-3" /> Default Address
                                            </p>
                                            <button onClick={() => setManagingAddresses(true)} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">
                                                Manage
                                            </button>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                            {profile?.address || "No default address set"}
                                        </p>
                                    </div>
                                </div>

                                <Link href="/profile/wallet" className="flex items-center justify-between p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-3xl group transition-all hover:bg-red-100 dark:hover:bg-red-900/20">
                                    <div className="flex items-center gap-4">
                                        <Wallet className="w-6 h-6 text-red-500 group-hover:scale-125 transition-transform" />
                                        <span className="font-black text-red-900 dark:text-red-400 uppercase tracking-widest text-xs">Wallet & Ledger</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-red-500 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <Link href="/profile/tickets" className="flex items-center justify-between p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl group transition-all hover:bg-amber-100 dark:hover:bg-amber-900/20">
                                    <div className="flex items-center gap-4">
                                        <MessageSquare className="w-6 h-6 text-amber-500 group-hover:scale-125 transition-transform" />
                                        <span className="font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest text-xs">Support Tickets</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <Link href="/profile/wishlist" className="flex items-center justify-between p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-3xl group transition-all hover:bg-rose-100 dark:hover:bg-rose-900/20">
                                    <div className="flex items-center gap-4">
                                        <Heart className="w-6 h-6 text-rose-500 fill-rose-500 group-hover:scale-125 transition-transform" />
                                        <span className="font-black text-rose-900 dark:text-rose-400 uppercase tracking-widest text-xs">My Favorites</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <button
                                onClick={() => signOut()}
                                className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/10 sm:mt-10 sm:p-5"
                            >
                                <LogOut className="w-4 h-4" /> Sign Out
                            </button>
                        </div>
                    </motion.div>

                    {/* Main Content / Orders */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-8 lg:w-2/3 lg:space-y-10"
                    >
                        <div className="flex flex-col gap-3 border-b border-slate-100 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between sm:gap-4 sm:pb-6">
                            <h2 className="flex items-center gap-3 text-3xl font-black tracking-tighter text-slate-900 dark:text-white sm:text-4xl">
                                <Package className="h-8 w-8 text-red-600 sm:h-10 sm:w-10" /> Recent <span className="text-gradient">Orders</span>
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{orders.length} total</p>
                        </div>

                        {orders.length === 0 ? (
                            <div className="glass-card p-20 text-center border-white/20 premium-shadow rounded-[3rem]">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <Package className="w-12 h-12 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No past orders</h3>
                                <p className="text-slate-400 font-bold mb-10 max-w-xs mx-auto text-sm uppercase tracking-tight">Your order history is empty. Let's find something delicious!</p>
                                <Link href="/" className="inline-block bg-red-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-red-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-red-500/40">
                                    Start Browsing
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {orders.map((order, index) => {
                                    const statusList = ["pending", "processing", "shipped", "delivered"];
                                    const currentStatusIndex = statusList.indexOf(order.status) !== -1 ? statusList.indexOf(order.status) : 0;
                                    const isCancelled = order.status === "cancelled";
                                    const hasReviewed = reviews.some(r => r.orderId === order._id);
                                    const orderImage = getPrimaryOrderImage(order);
                                    const orderSummary = getOrderItemSummary(order);
                                    const orderMeta = getOrderMetaLabel(order);

                                    return (
                                        <motion.div 
                                            key={order._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="glass-card p-5 sm:p-8 md:p-10 border-white/20 premium-shadow rounded-3xl md:rounded-[3rem] group hover:border-red-500/30 transition-all overflow-hidden relative"
                                        >
                                            {/* Decorative Background Element */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 rounded-full -mr-16 -mt-16 group-hover:bg-red-600/10 transition-colors" />

                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-10 relative z-10">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1 text-[10px] font-black tracking-[0.2em] rounded-lg uppercase shadow-lg">
                                                            #ORD-{order._id.slice(-6).toUpperCase()}
                                                        </span>
                                                        <span className={`px-4 py-1 text-[10px] font-black rounded-lg uppercase tracking-tight ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                            order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Arrived on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric'
                                                        })} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex flex-col items-end gap-2">
                                                    {order.deliveryOtp && !isCancelled && order.status !== 'delivered' && order.deliveryStatus !== 'delivered' && (
                                                        <div className="mb-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-xl border border-red-100 dark:border-red-800 text-right">
                                                            <p className="text-[8px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Delivery PIN</p>
                                                            <p className="text-xl font-black text-red-600 dark:text-red-400 tracking-[0.2em] leading-none">{order.deliveryOtp}</p>
                                                        </div>
                                                    )}
                                                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                                        <span className="text-red-600 text-xl italic mr-1">₹</span>{order.total}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                                        {order.paymentMethod === 'upi' ? 'Secure UPI' : 'COD'} · {order.items?.length || 0} ITEMS {order.tipAmount ? `· +₹${order.tipAmount} TIP 💝` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-6 sm:mb-8 relative z-10">
                                                <div className="flex items-start gap-4 p-4 sm:p-5 bg-white/70 dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-slate-800">
                                                    <div className="w-20 h-20 rounded-[1.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex-shrink-0">
                                                        {orderImage ? (
                                                            <img src={orderImage} alt={orderSummary} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-red-500 px-2 text-center">
                                                                {order.type === "service" ? "Service" : "Order"}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Order Summary</p>
                                                        <p className="text-sm sm:text-base font-black text-slate-900 dark:text-white leading-snug line-clamp-2">{orderSummary}</p>
                                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-2">{orderMeta}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Progress */}
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-6 sm:mb-10 relative">
                                                <div className="relative flex justify-between h-12 items-center">
                                                    {/* Progress Line Track */}
                                                    <div className="absolute left-[12.5%] right-[12.5%] top-1/2 -mt-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        {!isCancelled && (
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(currentStatusIndex / (statusList.length - 1)) * 100}%` }}
                                                                className="h-full bg-red-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                                                            />
                                                        )}
                                                    </div>

                                                    {isCancelled ? (
                                                        <div className="w-full flex justify-center z-10">
                                                            <div className="bg-rose-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/30">
                                                                Order Terminated
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        statusList.map((step, idx) => {
                                                            const isCompleted = idx <= currentStatusIndex;
                                                            const isActive = idx === currentStatusIndex;

                                                            let Icon = Clock;
                                                            if (step === 'processing') Icon = Package;
                                                            if (step === 'shipped') Icon = Truck;
                                                            if (step === 'delivered') Icon = CheckCircle2;

                                                            return (
                                                                <div key={step} className="flex flex-col items-center gap-3 z-10 w-1/4">
                                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center border-4 border-white dark:border-slate-900 transition-all duration-500 ${isCompleted ? 'bg-red-600 text-white scale-110 shadow-lg shadow-red-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'
                                                                        } ${isActive ? 'ring-4 sm:ring-8 ring-red-500/10' : ''}`}>
                                                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                    </div>
                                                                    <span className={`text-[9px] sm:text-[10px] font-black tracking-tighter sm:tracking-widest uppercase transition-colors text-center w-full leading-tight px-0.5 sm:px-1 ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'
                                                                        }`}>
                                                                        {step.replace(/_/g, " ")}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4">
                                                {["processing", "shipped"].includes(order.status) && (
                                                    <Link 
                                                        href={`/track/${order._id}`}
                                                        className="flex-1 min-w-[130px] bg-red-600 text-white h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-95"
                                                    >
                                                        <Navigation className="w-4 h-4" /> Live Tracking
                                                    </Link>
                                                )}
                                                
                                                {order.status === "delivered" && !hasReviewed && reviewOrder !== order._id && (
                                                    <button
                                                        onClick={() => setReviewOrder(order._id)}
                                                        className="flex-1 min-w-[130px] bg-amber-50 dark:bg-amber-900/10 text-amber-600 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-100 transition-all flex items-center justify-center gap-2 border border-amber-100 dark:border-amber-900/20"
                                                    >
                                                        <Star className="w-4 h-4" /> Rate Experience
                                                    </button>
                                                )}

                                                {/* ✅ Feature: Cancel Order button for pending orders */}
                                                {order.status === "pending" && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        disabled={cancellingOrder === order._id}
                                                        className="flex-1 min-w-[130px] bg-rose-50 dark:bg-rose-900/10 text-rose-600 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-all flex items-center justify-center gap-2 border border-rose-100 dark:border-rose-900/20 disabled:opacity-50"
                                                    >
                                                        {cancellingOrder === order._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Order"}
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => openSupportForOrder(order._id)}
                                                    className="flex-1 min-w-[130px] bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-300 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 border border-slate-100 dark:border-slate-800/50"
                                                >
                                                    Need Help?
                                                </button>
                                            </div>

                                            {/* Expandable Review Form */}
                                            <AnimatePresence>
                                                {reviewOrder === order._id && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-10 overflow-hidden"
                                                    >
                                                        <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Review Order</h4>
                                                                <button onClick={() => setReviewOrder(null)} className="text-rose-500 font-black text-[10px] uppercase tracking-widest">Discard</button>
                                                            </div>

                                                            <div className="flex gap-4 justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/20 shadow-inner">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setRating(star)}
                                                                        className={`p-3 rounded-2xl transition-all ${rating >= star ? 'bg-amber-100 text-amber-500 scale-110 shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-200'}`}
                                                                    >
                                                                        <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                                                <textarea
                                                                    value={comment}
                                                                    onChange={e => setComment(e.target.value)}
                                                                    placeholder="Describe your delivery experience..."
                                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] text-sm focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20 outline-none resize-none font-bold placeholder:italic shadow-inner"
                                                                    rows={4}
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    disabled={submittingReview}
                                                                    className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] rounded-3xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                                                >
                                                                    {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Review"}
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>

            {/* Address Book Modal */}
            <AnimatePresence>
                {managingAddresses && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-card w-full max-w-lg overflow-hidden rounded-[2rem] bg-white shadow-2xl dark:bg-slate-950 sm:rounded-[2.5rem]"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 p-6 pb-5 dark:border-slate-800 sm:p-8 sm:pb-6">
                                <h3 className="flex items-center gap-3 text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                                    <MapPin className="w-6 h-6 text-red-600" /> Address Book
                                </h3>
                                <button onClick={() => setManagingAddresses(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 font-black text-slate-500 transition-colors hover:text-slate-900 dark:bg-slate-900 dark:hover:text-white">
                                    ✕
                                </button>
                            </div>

                            <div className="max-h-[70vh] overflow-y-auto space-y-4 p-6 custom-scrollbar sm:max-h-[60vh] sm:p-8">
                                {profile?.savedAddresses?.length === 0 && !newAddressForm && (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500 font-bold mb-4 text-sm">No saved addresses yet.</p>
                                        <button onClick={() => setNewAddressForm(true)} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-colors">
                                            Add New Address
                                        </button>
                                    </div>
                                )}

                                {!newAddressForm && profile?.savedAddresses?.map((addr: any) => (
                                    <div key={addr._id} className={`p-5 rounded-2xl border-2 transition-all ${profile.address === addr.address ? 'border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">
                                                {addr.label || "Home"}
                                            </span>
                                            <div className="flex gap-2">
                                                {profile.address !== addr.address && (
                                                    <button onClick={() => handleSetDefaultAddress(addr)} className="text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">
                                                        Set Default
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteAddress(addr._id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{addr.address}</p>
                                    </div>
                                ))}

                                {profile?.savedAddresses?.length > 0 && !newAddressForm && (
                                    <button onClick={() => setNewAddressForm(true)} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:border-red-500 hover:text-red-600 transition-all focus:outline-none focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20">
                                        + Add New Address
                                    </button>
                                )}

                                {newAddressForm && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                        <div className="flex gap-2 mb-4">
                                            {["Home", "Work", "Other"].map(lbl => (
                                                <button key={lbl} onClick={() => setNewAddress({ ...newAddress, label: lbl })} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newAddress.label === lbl ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 outline-none hover:bg-slate-100'}`}>
                                                    {lbl}
                                                </button>
                                            ))}
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Full Address</label>
                                                <button onClick={handleLocateAddress} disabled={addressLocating} className="text-[10px] font-black text-red-600 uppercase tracking-widest disabled:opacity-50">
                                                    {addressLocating ? 'Locating...' : 'Auto Detect'}
                                                </button>
                                            </div>
                                            <textarea 
                                                rows={3}
                                                value={newAddress.address} 
                                                onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm font-bold resize-none focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/20 outline-none"
                                                placeholder="Street, City, PIN..."
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setNewAddressForm(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-80 transition-opacity">
                                                Cancel
                                            </button>
                                            <button onClick={handleAddAddress} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/30 hover:bg-red-700 transition-colors">
                                                Save
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );

}

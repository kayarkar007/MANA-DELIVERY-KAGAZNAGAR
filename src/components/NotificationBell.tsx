"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import PushNotificationToggle from "@/components/PushNotificationToggle";

export default function NotificationBell() {
    const { data: session } = useSession();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const isFetchingRef = useRef(false);

    const fetchNotifications = useCallback(async (silent = false) => {
        if (!session?.user) return;
        if (isFetchingRef.current) return; // prevent race condition
        isFetchingRef.current = true;

        if (!silent) setLoading(true);

        try {
            const res = await fetch("/api/notifications?limit=8", { cache: "no-store" });
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data || []);
                setUnreadCount(data.unreadCount ?? 0);
            }
        } catch {
            // ignore network errors silently
        } finally {
            if (!silent) setLoading(false);
            isFetchingRef.current = false;
        }
    }, [session?.user?.id]);

    const markAllRead = async () => {
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true }),
        });
        setUnreadCount(0);
        setNotifications((prev) =>
            prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() }))
        );
    };

    // ── Real-time update mechanisms ─────────────────────────────────────────
    useEffect(() => {
        if (!session?.user?.id) return;

        // Initial load
        fetchNotifications();

        // 1. SSE Stream (MongoDB Change Stream or poll fallback in stream route)
        let eventSource: EventSource | null = null;
        const connectSSE = () => {
            eventSource = new EventSource("/api/notifications/stream");
            eventSource.onmessage = (e) => {
                try {
                    const payload = JSON.parse(e.data);
                    // Ignore heartbeat pings
                    if (payload?.type === "ping") return;
                    // SSE already sends unreadCount — use it directly (no extra fetch)
                    if (typeof payload.unreadCount === "number") {
                        setUnreadCount(payload.unreadCount);
                    }
                    // Refresh full list silently so panel is up-to-date
                    fetchNotifications(true);
                } catch {
                    // malformed event
                }
            };
            eventSource.onerror = () => {
                // SSE connection dropped — will reconnect automatically via browser
            };
        };
        connectSSE();

        // 2. Custom event from PushMessageListener (foreground push received)
        const onNewNotification = () => fetchNotifications(true);
        window.addEventListener("notification:new", onNewNotification);

        // 3. Faster polling as safety net (15 seconds) — still much better than 45s
        const tick = () => {
            if (document.visibilityState === "visible") {
                fetchNotifications(true);
            }
        };
        const interval = setInterval(tick, 15000);
        document.addEventListener("visibilitychange", tick);

        return () => {
            eventSource?.close();
            window.removeEventListener("notification:new", onNewNotification);
            clearInterval(interval);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [session?.user?.id, fetchNotifications]);

    // ── Close panel on outside click ────────────────────────────────────────
    useEffect(() => {
        if (!open) return;
        const handlePointerDown = (e: MouseEvent) => {
            if (!panelRef.current?.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [open]);

    if (!session?.user) return null;

    return (
        <div className="relative">
            <button
                id="notification-bell-btn"
                onClick={() => {
                    const nextOpen = !open;
                    setOpen(nextOpen);
                    if (nextOpen) fetchNotifications(true);
                }}
                aria-label="Notifications"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(214,160,70,0.14)] bg-[rgba(255,255,255,0.05)] text-[#e3cbc0] transition-all duration-300 hover:bg-red-500/10 hover:text-white sm:h-[2.9rem] sm:w-[2.9rem]"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                        {Math.min(unreadCount, 9)}
                    </span>
                )}
            </button>

            {open && (
                <div
                    ref={panelRef}
                    data-testid="notification-panel"
                    className="fixed inset-x-2 z-[100] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:inset-x-auto sm:right-4 sm:w-[22rem] sm:max-w-[calc(100vw-2rem)]"
                    style={{ top: "calc(env(safe-area-inset-top, 0px) + 4rem)", maxHeight: "calc(100vh - env(safe-area-inset-top, 0px) - 6rem)" }}
                >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">Notifications</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                {unreadCount} unread
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllRead}
                                className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 transition-colors"
                            >
                                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification list */}
                    <div className="overflow-y-auto" style={{ maxHeight: "min(22rem, calc(100vh - 12rem))" }}>
                        {loading ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">No notifications yet.</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                    You&apos;ll be notified about orders, payments, and more.
                                </p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <Link
                                    key={notification._id}
                                    href={notification.href || "#"}
                                    onClick={() => setOpen(false)}
                                    className={`block px-5 py-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                                        notification.readAt ? "" : "bg-red-50/50 dark:bg-red-900/10"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                                                {notification.title}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                {notification.message}
                                            </p>
                                        </div>
                                        {!notification.readAt && (
                                            <span className="w-2 h-2 mt-1.5 rounded-full bg-red-600 flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                                        {new Date(notification.createdAt).toLocaleString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Push notification toggle at bottom */}
                    <PushNotificationToggle />
                </div>
            )}
        </div>
    );
}

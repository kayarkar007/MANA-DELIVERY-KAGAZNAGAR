"use client";

import { useEffect, useState } from "react";
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

    const fetchNotifications = async (silent = false) => {
        if (!session?.user) return;
        if (!silent) setLoading(true);

        try {
            const res = await fetch("/api/notifications?limit=8");
            const data = await res.json();
            if (data.success) {
                setNotifications(data.data || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } finally {
            setLoading(false);
        }
    };

    const markAllRead = async () => {
        await fetch("/api/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAll: true }),
        });
        setUnreadCount(0);
        setNotifications((prev) => prev.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
    };

    useEffect(() => {
        if (!session?.user) return;

        fetchNotifications();

        const tick = () => {
            if (document.visibilityState === "visible") {
                fetchNotifications(true);
            }
        };

        const interval = setInterval(tick, 45000);
        document.addEventListener("visibilitychange", tick);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [session?.user?.id]);

    if (!session?.user) return null;

    return (
        <div className="relative">
            <button
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
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-white dark:border-slate-900">
                        {Math.min(unreadCount, 9)}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 z-50 mt-3 w-[20rem] max-w-[calc(100vw-1rem)] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:w-[22rem] sm:max-w-[calc(100vw-2rem)]">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white">Notifications</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{unreadCount} unread</p>
                        </div>
                        <button
                            onClick={markAllRead}
                            className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600"
                        >
                            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                    </div>

                    <div className="max-h-[24rem] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-red-600" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                                No notifications yet.
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
                                            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{notification.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notification.message}</p>
                                        </div>
                                        {!notification.readAt && <span className="w-2 h-2 mt-1 rounded-full bg-red-600 flex-shrink-0" />}
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                                        {new Date(notification.createdAt).toLocaleString()}
                                    </p>
                                </Link>
                            ))
                        )}
                    </div>
                    <PushNotificationToggle />
                </div>
            )}
        </div>
    );
}

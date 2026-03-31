"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function PendingOrderBadge() {
    const { data: session, status } = useSession();
    const [count, setCount] = useState(0);
    const prevCountRef = useRef(0);

    useEffect(() => {
        if (status !== "authenticated" || session?.user?.role !== "admin") {
            return;
        }

        const controller = new AbortController();
        let active = true;

        const fetchCount = async () => {
            try {
                const res = await fetch("/api/admin/orders/pending-count", {
                    cache: "no-store",
                    signal: controller.signal,
                });
                if (!res.ok || !active) return;

                const data = await res.json();

                if (!data.success || !active) return;

                const newCount = data.count;
                if (newCount > prevCountRef.current && prevCountRef.current !== 0) {
                    toast("New order received", {
                        description: `You have ${newCount} pending orders.`,
                        action: {
                            label: "View orders",
                            onClick: () => {
                                window.location.href = "/admin/orders";
                            },
                        },
                        duration: 10000,
                    });

                    try {
                        const audio = new Audio("/notification.mp3");
                        audio.play().catch(() => {});
                    } catch {
                        // Non-blocking.
                    }
                }

                setCount(newCount);
                prevCountRef.current = newCount;
            } catch (error) {
                if (!active || (error instanceof Error && error.name === "AbortError")) {
                    return;
                }

                console.error("Failed to fetch pending orders count", error);
            }
        };

        fetchCount();
        const notificationStream = new EventSource("/api/notifications/stream");
        notificationStream.onmessage = () => {
            fetchCount();
        };
        notificationStream.onerror = () => {
            // Fallback interval continues below.
        };

        const tick = () => {
            if (document.visibilityState === "visible") {
                fetchCount();
            }
        };

        const interval = setInterval(tick, 20000);
        document.addEventListener("visibilitychange", tick);

        return () => {
            active = false;
            controller.abort();
            notificationStream.close();
            clearInterval(interval);
            document.removeEventListener("visibilitychange", tick);
        };
    }, [session?.user?.role, status]);

    if (count === 0) return null;

    return (
        <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white shadow-sm">
            {count}
        </span>
    );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function PendingOrderBadge() {
    const [count, setCount] = useState(0);
    const prevCountRef = useRef(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch("/api/admin/orders/pending-count");
                const data = await res.json();

                if (!data.success) return;

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
            } catch {
                console.error("Failed to fetch pending orders count");
            }
        };

        fetchCount();

        const tick = () => {
            if (document.visibilityState === "visible") {
                fetchCount();
            }
        };

        const interval = setInterval(tick, 20000);
        document.addEventListener("visibilitychange", tick);

        return () => {
            clearInterval(interval);
            document.removeEventListener("visibilitychange", tick);
        };
    }, []);

    if (count === 0) return null;

    return (
        <span className="ml-auto inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-xs font-black text-white shadow-sm">
            {count}
        </span>
    );
}

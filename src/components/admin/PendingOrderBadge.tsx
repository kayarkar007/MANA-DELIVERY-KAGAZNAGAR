"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

export default function PendingOrderBadge() {
    const [count, setCount] = useState(0);
    const prevCountRef = useRef(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch("/api/admin/orders/pending-count");
                const data = await res.json();
                if (data.success) {
                    const newCount = data.count;

                    // If count increased, alert the admin
                    if (newCount > prevCountRef.current && prevCountRef.current !== 0) {
                        toast('🔔 New Order Received!', {
                            description: `You have ${newCount} pending orders.`,
                            action: {
                                label: 'View Orders',
                                onClick: () => window.location.href = '/admin/orders',
                            },
                            duration: 10000,
                        });

                        // Play a notification sound
                        try {
                            const audio = new Audio('/notification.mp3');
                            audio.play().catch(() => {});
                        } catch (e) {
                            // ignore audio error
                        }
                    }

                    setCount(newCount);
                    prevCountRef.current = newCount;
                }
            } catch (error) {
                console.error("Failed to fetch pending orders count");
            }
        };

        // Fetch immediately on mount
        fetchCount();

        // Poll every 10 seconds for faster updates
        const interval = setInterval(fetchCount, 10000);
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <span className="ml-auto inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {count}
        </span>
    );
}

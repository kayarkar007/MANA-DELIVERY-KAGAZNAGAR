"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/**
 * Global listener mounted once in layout.tsx.
 * Handles:
 *  1. Foreground push notifications (from Service Worker postMessage)
 *     → Shows a sonner toast with a "View" action
 *  2. Dispatches a custom browser event "notification:new" so that
 *     NotificationBell can refresh its panel count without a prop-drill.
 */
export default function PushMessageListener() {
    const router = useRouter();

    useEffect(() => {
        if (!("serviceWorker" in navigator)) return;

        const handleMessage = (event: MessageEvent) => {
            if (!event.data || event.data.type !== "FOREGROUND_NOTIFICATION") return;

            const { title, body, data } = event.data.payload || {};

            // 1. Show in-app toast
            toast(title || "Mana Delivery", {
                description: body,
                duration: 8000,
                action: data?.href
                    ? {
                          label: "View",
                          onClick: () => router.push(data.href),
                      }
                    : undefined,
            });

            // 2. Tell the NotificationBell to refresh its count
            window.dispatchEvent(new CustomEvent("notification:new"));
        };

        navigator.serviceWorker.addEventListener("message", handleMessage);
        return () => navigator.serviceWorker.removeEventListener("message", handleMessage);
    }, [router]);

    return null;
}

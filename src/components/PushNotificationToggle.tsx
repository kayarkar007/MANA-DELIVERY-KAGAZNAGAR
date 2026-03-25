"use client";

import { useEffect, useState } from "react";
import { BellRing, Loader2, Smartphone } from "lucide-react";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export default function PushNotificationToggle() {
    const [supported, setSupported] = useState(false);
    const [loading, setLoading] = useState(true);
    const [subscribed, setSubscribed] = useState(false);
    const [publicKey, setPublicKey] = useState("");

    useEffect(() => {
        const setup = async () => {
            const canUsePush =
                typeof window !== "undefined" &&
                "Notification" in window &&
                "serviceWorker" in navigator &&
                "PushManager" in window;

            setSupported(canUsePush);
            if (!canUsePush) {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch("/api/push-subscriptions");
                const data = await res.json();
                if (data.success) {
                    setSubscribed(Boolean(data.data?.subscribed));
                    setPublicKey(data.data?.publicKey || "");
                }
            } finally {
                setLoading(false);
            }
        };

        setup();
    }, []);

    const enablePush = async () => {
        if (!supported) {
            toast.error("Push notifications are not supported on this device.");
            return;
        }

        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                toast.error("Notification permission was not granted.");
                return;
            }

            const registration = await navigator.serviceWorker.register("/sw.js");
            const existingSubscription = await registration.pushManager.getSubscription();
            const subscription = existingSubscription || await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });

            const res = await fetch("/api/push-subscriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subscription }),
            });
            const data = await res.json();
            if (!data.success) {
                throw new Error(data.error || "Failed to enable push notifications");
            }

            setSubscribed(true);
            toast.success("Push notifications enabled");
        } catch (error: any) {
            toast.error(error.message || "Failed to enable push notifications");
        } finally {
            setLoading(false);
        }
    };

    const disablePush = async () => {
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.getRegistration("/sw.js") || await navigator.serviceWorker.getRegistration();
            const subscription = await registration?.pushManager.getSubscription();
            const endpoint = subscription?.endpoint;

            if (subscription) {
                await subscription.unsubscribe();
            }

            await fetch("/api/push-subscriptions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint }),
            });

            setSubscribed(false);
            toast.success("Push notifications disabled");
        } catch (error: any) {
            toast.error(error.message || "Failed to disable push notifications");
        } finally {
            setLoading(false);
        }
    };

    if (!supported) {
        return (
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                <div className="flex items-start gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <Smartphone className="w-4 h-4 mt-0.5 text-slate-400" />
                    <p>Browser push is not supported on this device.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Browser Push</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Order, payment, refund, and support alerts outside the app.</p>
                </div>
                <button
                    onClick={subscribed ? disablePush : enablePush}
                    disabled={loading || !publicKey}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${subscribed ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "bg-red-600 text-white"} disabled:opacity-50`}
                >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                    {subscribed ? "Disable" : "Enable"}
                </button>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share2, Smartphone, X } from "lucide-react";
import { toast } from "sonner";

type BeforeInstallPromptChoice = {
    outcome: "accepted" | "dismissed";
    platform: string;
};

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<BeforeInstallPromptChoice>;
}

const DISMISS_KEY = "mana-install-prompt-dismissed-at";
const DISMISS_TTL = 1000 * 60 * 60 * 24 * 7;

function isStandaloneMode() {
    if (typeof window === "undefined") return false;

    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
    );
}

export default function PwaInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [dismissed, setDismissed] = useState(true);
    const [installing, setInstalling] = useState(false);

    const device = useMemo(() => {
        if (typeof window === "undefined") {
            return { isIos: false, isSafari: false };
        }

        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        const isSafari = /safari/.test(userAgent) && !/crios|fxios|edgios|chrome/.test(userAgent);

        return { isIos, isSafari };
    }, []);

    useEffect(() => {
        setIsStandalone(isStandaloneMode());

        const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
        setDismissed(Boolean(dismissedAt && Date.now() - dismissedAt < DISMISS_TTL));

        const handleBeforeInstallPrompt = (event: Event) => {
            event.preventDefault();
            setDeferredPrompt(event as BeforeInstallPromptEvent);
        };

        const handleInstalled = () => {
            setDeferredPrompt(null);
            setIsStandalone(true);
            window.localStorage.removeItem(DISMISS_KEY);
            toast.success("Mana Delivery installed");
        };

        window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
        window.addEventListener("appinstalled", handleInstalled);

        return () => {
            window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
            window.removeEventListener("appinstalled", handleInstalled);
        };
    }, []);

    const shouldShowIosHelp = device.isIos && device.isSafari && !isStandalone;
    const canShowPrompt = !dismissed && !isStandalone && (Boolean(deferredPrompt) || shouldShowIosHelp);

    if (!canShowPrompt) {
        return null;
    }

    const dismiss = () => {
        window.localStorage.setItem(DISMISS_KEY, `${Date.now()}`);
        setDismissed(true);
    };

    const handleInstall = async () => {
        if (!deferredPrompt) {
            dismiss();
            return;
        }

        setInstalling(true);

        try {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;

            if (choice.outcome === "accepted") {
                toast.success("Install prompt opened");
            } else {
                toast.message("You can install Mana Delivery later from your browser menu.");
            }

            setDeferredPrompt(null);
            dismiss();
        } finally {
            setInstalling(false);
        }
    };

    return (
        <div className="mx-auto mt-3 w-full max-w-7xl px-2.5 sm:px-4">
            <div className="app-card flex items-start gap-3 rounded-[1.75rem] border border-[rgba(214,160,70,0.14)] bg-[linear-gradient(135deg,rgba(255,248,242,0.96),rgba(255,255,255,0.88))] px-4 py-4 shadow-[0_18px_50px_rgba(59,24,28,0.12)] dark:bg-[linear-gradient(135deg,rgba(19,7,9,0.96),rgba(10,4,6,0.92))] sm:items-center sm:px-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.15rem] bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-white shadow-[0_18px_34px_rgba(123,15,19,0.28)]">
                    {shouldShowIosHelp ? <Share2 className="h-5 w-5" /> : <Download className="h-5 w-5" />}
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 dark:text-red-300">
                        Install App
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-900 dark:text-white">
                        {shouldShowIosHelp ? "Add Mana Delivery to your home screen on iPhone." : "Install Mana Delivery like a native app."}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                        {shouldShowIosHelp
                            ? "Open Safari share menu, then tap Add to Home Screen for full-screen launch and faster reopen."
                            : "Get standalone launch, app icon access, and a cleaner mobile experience without browser chrome."}
                    </p>
                </div>

                <div className="flex shrink-0 flex-col gap-2 self-stretch sm:flex-row sm:items-center sm:self-center">
                    {shouldShowIosHelp ? (
                        <button type="button" onClick={dismiss} className="app-button app-button-primary min-w-[9rem] rounded-[1rem]">
                            <Smartphone className="h-4 w-4" />
                            Got it
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleInstall}
                            disabled={installing}
                            className="app-button app-button-primary min-w-[9rem] rounded-[1rem] disabled:opacity-60"
                        >
                            <Download className="h-4 w-4" />
                            {installing ? "Opening..." : "Install"}
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={dismiss}
                        className="inline-flex h-11 items-center justify-center rounded-[1rem] border border-slate-200/80 px-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800/80 dark:text-slate-400"
                        aria-label="Dismiss install prompt"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}

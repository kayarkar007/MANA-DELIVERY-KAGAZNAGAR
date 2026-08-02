"use client";

import { useState, useRef, useCallback, Suspense, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Loader2, Smartphone, ShieldCheck, RefreshCw, AlertCircle, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import {
    RecaptchaVerifier,
    signInWithPhoneNumber,
    type ConfirmationResult,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";

// ─── OTP digit-box input ───────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);

    useEffect(() => {
        if (value === "") setDigits(["", "", "", "", "", ""]);
        else if (value.length === 6) setDigits(value.split(""));
    }, [value]);

    const update = (idx: number, char: string) => {
        if (!/^\d?$/.test(char)) return;
        const next = [...digits];
        next[idx] = char;
        setDigits(next);
        onChange(next.join(""));
        if (char && idx < 5) refs.current[idx + 1]?.focus();
    };

    const onKeyDown = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus();
        if (e.key === "ArrowLeft" && idx > 0) refs.current[idx - 1]?.focus();
        if (e.key === "ArrowRight" && idx < 5) refs.current[idx + 1]?.focus();
    };

    const onPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const next = pasted.split("").concat(["", "", "", "", "", ""]).slice(0, 6);
        setDigits(next);
        onChange(next.join(""));
        refs.current[Math.min(pasted.length, 5)]?.focus();
    };

    return (
        <div className="flex justify-center gap-2 sm:gap-3">
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={(el) => { refs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => update(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    onPaste={onPaste}
                    className={`w-10 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-2xl border-2 outline-none transition-all
                        bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white
                        ${d
                            ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-100 dark:shadow-red-900/20"
                            : "border-slate-200 dark:border-slate-700 focus:border-red-400 focus:ring-4 focus:ring-red-500/15"
                        }`}
                />
            ))}
        </div>
    );
}

function useCountdown(seconds: number) {
    const [t, setT] = useState(seconds);
    const reset = () => setT(seconds);
    useEffect(() => {
        if (t <= 0) return;
        const id = setTimeout(() => setT((s) => s - 1), 1000);
        return () => clearTimeout(id);
    }, [t]);
    const m = String(Math.floor(t / 60)).padStart(2, "0");
    const s = String(t % 60).padStart(2, "0");
    return { timeLeft: t, label: `${m}:${s}`, reset };
}

// ─── Main form (needs search params) ─────────────────────────────────────────
function VerifyPhoneForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { update: updateSession } = useSession();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [step, setStep] = useState<"enter-phone" | "enter-otp" | "done">("enter-phone");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isFallbackMode, setIsFallbackMode] = useState(false);
    const countdown = useCountdown(60);

    // Firebase refs
    const confirmationRef = useRef<ConfirmationResult | null>(null);
    const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

    // Clean up reCAPTCHA on unmount
    useEffect(() => {
        return () => {
            try { recaptchaRef.current?.clear(); } catch { }
        };
    }, []);

    const resetRecaptcha = useCallback(() => {
        try {
            if (recaptchaRef.current) recaptchaRef.current.clear();
        } catch { }
        recaptchaRef.current = null;
        confirmationRef.current = null;
        const el = document.getElementById("recaptcha-container");
        if (el) el.innerHTML = "";
    }, []);

    const getRecaptcha = useCallback((): RecaptchaVerifier => {
        resetRecaptcha();
        recaptchaRef.current = new RecaptchaVerifier(
            firebaseAuth,
            "recaptcha-container",
            { size: "invisible" }
        );
        return recaptchaRef.current;
    }, [resetRecaptcha]);

    // ── Server Fallback Send OTP ──────────────────────────────────────────────
    const sendServerOtp = async (cleanPhone: string) => {
        setIsFallbackMode(true);
        const res = await fetch("/api/auth/phone-otp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone: cleanPhone, allowCreate: true }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error || "Failed to send verification code.");
            setLoading(false);
        } else {
            toast.success("Verification code sent!");
            setStep("enter-otp");
            countdown.reset();
            setLoading(false);
        }
    };

    // ── Step 1: Send OTP ─────────────────────────────────────────────────────
    const sendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 10) { setError("Enter a valid 10-digit mobile number."); return; }

        setLoading(true);

        // Check if test number -> bypass directly to server OTP
        const isTestNumber = digits === "7659989336" || digits === "9494378247";
        if (isTestNumber) {
            await sendServerOtp(digits);
            return;
        }

        // Try Firebase Phone Auth first
        try {
            const appVerifier = getRecaptcha();
            const result = await signInWithPhoneNumber(firebaseAuth, `+91${digits}`, appVerifier);
            confirmationRef.current = result;
            setIsFallbackMode(false);
            toast.success("OTP sent to your mobile!");
            setStep("enter-otp");
            countdown.reset();
            setLoading(false);
        } catch (err: any) {
            console.warn("Firebase Phone Auth failed, attempting server fallback:", err?.code || err?.message);
            resetRecaptcha();
            // Fallback cleanly to server OTP handler
            await sendServerOtp(digits);
        }
    };

    // ── Step 2: Verify OTP ───────────────────────────────────────────────────
    const verifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) { setError("Enter all 6 digits."); return; }
        setError("");
        setLoading(true);

        // 1. If Firebase confirmation object is present, verify via Firebase ID token
        if (confirmationRef.current && !isFallbackMode) {
            try {
                const userCredential = await confirmationRef.current.confirm(otp);
                const firebaseIdToken = await userCredential.user.getIdToken();

                const res = await fetch("/api/auth/phone-otp/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ phone, firebaseIdToken }),
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    await signIn("phone-otp", { redirect: false, phone, userId: data.user.id });
                    await updateSession();
                    setStep("done");
                    toast.success("📱 Phone verified! You're all set.");
                    setTimeout(() => router.replace(callbackUrl), 1500);
                    return;
                }
            } catch (err: any) {
                console.warn("Firebase confirmation failed, trying server verify fallback:", err?.message);
            }
        }

        // 2. Server verification fallback (verifies 6-digit OTP in MongoDB / test OTP)
        try {
            const res = await fetch("/api/auth/phone-otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, otp }),
            });
            const data = await res.json();

            if (!res.ok || !data.success) {
                setError(data.error || "Incorrect OTP. Please check and try again.");
                setLoading(false);
                return;
            }

            await signIn("phone-otp", { redirect: false, phone, userId: data.user.id });
            await updateSession();

            setStep("done");
            toast.success("📱 Phone verified! You're all set.");
            setTimeout(() => router.replace(callbackUrl), 1500);
        } catch {
            setError("Verification failed. Please try again.");
            setLoading(false);
        }
    };

    // ── Resend ───────────────────────────────────────────────────────────────
    const resend = () => {
        if (countdown.timeLeft > 0) return;
        resetRecaptcha();
        setOtp("");
        setError("");
        setStep("enter-phone");
    };

    const isTestNum = phone.replace(/\D/g, "") === "7659989336" || phone.replace(/\D/g, "") === "9494378247";

    if (step === "done") {
        return (
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Phone Verified!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Redirecting you to the app...</p>
                <Loader2 className="w-5 h-5 animate-spin text-red-500 mx-auto mt-4" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container" />

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-50 dark:bg-rose-900/10 p-3.5 text-sm font-medium text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            {step === "enter-phone" && (
                <form onSubmit={sendOtp} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Your Mobile Number
                        </label>
                        <div className="flex rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/15 transition bg-slate-50 dark:bg-slate-900">
                            <span className="flex items-center px-3.5 text-slate-500 dark:text-slate-400 font-black text-sm border-r border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                                🇮🇳 +91
                            </span>
                            <input
                                type="tel"
                                autoComplete="tel"
                                inputMode="numeric"
                                maxLength={10}
                                value={phone}
                                onChange={(e) => { setError(""); setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); }}
                                className="flex-1 min-w-0 bg-transparent text-slate-900 dark:text-white px-4 py-4 outline-none font-medium text-base placeholder:text-slate-400"
                                placeholder="9876543210"
                                required
                                autoFocus
                            />
                        </div>
                        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                            We'll send a 6-digit OTP to verify your number.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || phone.length < 10}
                        className="w-full app-button app-button-primary rounded-2xl py-4 font-black shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Smartphone className="w-4 h-4" /> Send OTP</>}
                    </button>
                </form>
            )}

            {step === "enter-otp" && (
                <form onSubmit={verifyOtp} className="space-y-5">
                    <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                        Code sent to{" "}
                        <span className="font-black text-slate-900 dark:text-white">+91 {phone}</span>
                        <button type="button" onClick={() => { resetRecaptcha(); setStep("enter-phone"); setOtp(""); }} className="ml-2 text-red-500 font-black text-xs hover:underline">
                            Change
                        </button>
                    </p>

                    {isTestNum && (
                        <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Test mode: Use OTP <strong>123456</strong></span>
                        </div>
                    )}

                    <OtpInput value={otp} onChange={setOtp} />

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="w-full app-button app-button-primary rounded-2xl py-4 font-black shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Verify Phone</>}
                    </button>

                    <div className="text-center">
                        {countdown.timeLeft > 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Resend in{" "}
                                <span className={`font-black tabular-nums ${countdown.timeLeft <= 15 ? "text-red-500" : "text-slate-700 dark:text-slate-300"}`}>
                                    {countdown.label}
                                </span>
                            </p>
                        ) : (
                            <button type="button" onClick={resend} disabled={loading} className="flex items-center gap-2 mx-auto text-sm font-black text-red-600 dark:text-red-400 hover:underline disabled:opacity-40">
                                <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}

// ─── Page wrapper ──────────────────────────────────────────────────────────────
export default function VerifyPhonePage() {
    return (
        <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 shadow-2xl backdrop-blur-xl p-5 sm:p-8 md:p-10">
            {/* Logo + Brand */}
            <div className="text-center mb-7">
                <div className="flex items-center justify-center gap-2.5 mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <Image src="/logo2.png" alt="Mana Delivery" width={44} height={44} className="object-contain" />
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Mana Delivery
                    </span>
                </div>

                {/* Icon badge */}
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Verify Your Phone</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-2 max-w-xs mx-auto leading-relaxed">
                    Add your mobile number to complete verification and start ordering.
                </p>
            </div>

            {/* Info banner */}
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 p-3.5 text-xs sm:text-sm text-amber-800 dark:text-amber-300">
                <span className="text-lg leading-none flex-shrink-0">🔒</span>
                <span className="font-medium">Your number is used for delivery OTPs and order alerts only. Never shared.</span>
            </div>

            <Suspense fallback={
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
            }>
                <VerifyPhoneForm />
            </Suspense>
        </div>
    );
}

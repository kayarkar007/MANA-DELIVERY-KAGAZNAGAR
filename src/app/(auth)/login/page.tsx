"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Loader2, ArrowLeft, Eye, EyeOff, AlertCircle,
    Smartphone, Mail, Chrome, ShieldCheck, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebaseClient";

// ─── OTP digit-box input ───────────────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);

    useEffect(() => {
        if (value === "") setDigits(["", "", "", "", "", ""]);
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

type Tab = "phone" | "email";

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const [tab, setTab] = useState<Tab>("phone");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [unregistered, setUnregistered] = useState<{ phone?: string; email?: string } | null>(null);

    // ── Phone OTP ─────────────────────────────────────────────────────────────
    const [phone, setPhone] = useState("");
    const [otpStep, setOtpStep] = useState(false);
    const [otp, setOtp] = useState("");
    const confirmationResultRef = useRef<ConfirmationResult | null>(null);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const countdown = useCountdown(60);

    // ── Email/password ─────────────────────────────────────────────────────────
    const [emailForm, setEmailForm] = useState({ email: "", password: "" });
    const [showPw, setShowPw] = useState(false);

    const redirectTarget = useMemo(() => {
        const cb = searchParams.get("callbackUrl");
        if (cb) {
            try {
                const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
                const parsed = new URL(cb, origin);
                if (
                    parsed.origin === origin &&
                    !["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/verify-phone"].includes(parsed.pathname)
                ) {
                    return `${parsed.pathname}${parsed.search}`;
                }
            } catch { /* ignore */ }
        }
        if (session?.user?.role === "admin") return "/admin";
        if (session?.user?.role === "rider") return "/rider";
        return "/";
    }, [searchParams, session?.user?.role]);

    useEffect(() => {
        if (status !== "authenticated") return;
        setLoading(false);
        router.replace(redirectTarget);
        router.refresh();
    }, [redirectTarget, router, status]);

    // Cleanup recaptcha on unmount
    useEffect(() => {
        return () => {
            if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
            }
        };
    }, []);

    // ── Send Phone OTP (Firebase with API fallback) ───────────────────────────
    const sendPhoneOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const digits = phone.replace(/\D/g, "");
        if (digits.length < 10) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        setLoading(true);

        try {
            const formattedE164 = `+91${digits.slice(-10)}`;

            // Try Firebase Phone Auth first
            if (firebaseAuth) {
                if (!recaptchaVerifierRef.current) {
                    recaptchaVerifierRef.current = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", {
                        size: "invisible",
                        callback: () => {},
                    });
                }

                const confirmationResult = await signInWithPhoneNumber(
                    firebaseAuth,
                    formattedE164,
                    recaptchaVerifierRef.current
                );
                confirmationResultRef.current = confirmationResult;
                toast.success("OTP sent to your mobile via Firebase!");
                setOtpStep(true);
                countdown.reset();
                setLoading(false);
                return;
            }
        } catch (firebaseErr: any) {
            console.warn("⚠️ Firebase Phone Auth fallback to server SMS API:", firebaseErr.message);
            if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
                recaptchaVerifierRef.current = null;
            }
        }

        // Fallback to server SMS API (checks if registered)
        try {
            const res = await fetch("/api/auth/phone-otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                if (data.isRegistered === false) {
                    setUnregistered({ phone });
                }
                setLoading(false);
                return;
            }
            toast.success("OTP sent to your mobile!");
            setOtpStep(true);
            countdown.reset();
        } catch {
            setError("Failed to send OTP. Please try again.");
        }
        setLoading(false);
    };

    // ── Verify Phone OTP ──────────────────────────────────────────────────────
    const verifyPhoneOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) { setError("Enter all 6 digits."); return; }
        setError("");
        setLoading(true);

        let firebaseIdToken: string | undefined;

        try {
            if (confirmationResultRef.current) {
                const userCredential = await confirmationResultRef.current.confirm(otp);
                firebaseIdToken = await userCredential.user.getIdToken();
            }
        } catch (fbErr: any) {
            console.warn("⚠️ Firebase verification error, falling back to server verification:", fbErr.message);
        }

        try {
            const res = await fetch("/api/auth/phone-otp/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone,
                    otp,
                    firebaseIdToken,
                    isVerifiedDirectly: !!firebaseIdToken,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error); setLoading(false); return; }

            const result = await signIn("phone-otp", {
                redirect: false,
                phone,
                userId: data.user.id,
            });
            if (result?.error) { setError(result.error); setLoading(false); return; }
            toast.success(`Welcome back, ${data.user.name}! 🎉`);
        } catch {
            setError("Verification failed. Please try again.");
            setLoading(false);
        }
    };

    const resendPhoneOtp = async () => {
        if (countdown.timeLeft > 0) return;
        setOtp("");
        setError("");
        sendPhoneOtp({ preventDefault: () => {} } as any);
    };

    // ── Email/Password ─────────────────────────────────────────────────────────
    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setUnregistered(null);
        setLoading(true);
        const res = await signIn("credentials", { redirect: false, ...emailForm });
        if (res?.error) {
            setError(res.error);
            if (res.error.toLowerCase().includes("no account found")) {
                setUnregistered({ email: emailForm.email });
            }
            toast.error(res.error);
            setLoading(false);
        }
        else { toast.success("Welcome back! 👋"); }
    };

    const tabs = [
        { id: "phone" as Tab, label: "Phone", icon: Smartphone },
        { id: "email" as Tab, label: "Email", icon: Mail },
    ];

    return (
        <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 shadow-2xl backdrop-blur-xl p-5 sm:p-7 md:p-10">
            {/* Invisible Firebase Recaptcha Container */}
            <div id="recaptcha-container"></div>

            <Link
                href="/"
                className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                aria-label="Back to home"
            >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            {/* Logo + Title */}
            <div className="text-center mb-6 mt-3">
                <div className="flex items-center justify-center gap-2.5 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                        <Image src="/logo2.png" alt="Mana Delivery" width={44} height={44} className="object-contain" />
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Mana Delivery
                    </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Welcome Back</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Sign in to continue ordering</p>
            </div>

            {/* Tab Switcher */}
            <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-900/80 p-1 mb-6 gap-1">
                {tabs.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => { setTab(id); setError(""); setOtpStep(false); setOtp(""); }}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-black transition-all ${
                            tab === id
                                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-md"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        }`}
                    >
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="hidden xs:inline sm:inline">{label}</span>
                    </button>
                ))}
            </div>

            {/* Error / Unregistered Banner */}
            {error && (
                <div className="mb-5 space-y-3">
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-50 dark:bg-rose-900/10 p-3.5 text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{error}</span>
                    </div>

                    {unregistered && (
                        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 text-center space-y-2">
                            <p className="text-xs font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                                ⚠️ Account Not Registered
                            </p>
                            <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                                No account was found for this {unregistered.phone ? `phone number (+91 ${unregistered.phone})` : `email (${unregistered.email})`}. Please create an account to save your name, address, and mobile number.
                            </p>
                            <Link
                                href={`/signup?${unregistered.phone ? `phone=${unregistered.phone}` : `email=${encodeURIComponent(unregistered.email || '')}`}`}
                                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs py-3 transition shadow-md"
                            >
                                Create Account (Sign Up) →
                            </Link>
                        </div>
                    )}
                </div>
            )}

            {/* ── PHONE OTP TAB ──────────────────────────────────────────────── */}
            {tab === "phone" && (
                <>
                    {!otpStep ? (
                        <form onSubmit={sendPhoneOtp} className="space-y-5">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                                    Mobile Number
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
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || phone.length < 10}
                                className="w-full app-button app-button-primary rounded-2xl py-4 text-sm sm:text-base font-black shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Send OTP via Firebase →"}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={verifyPhoneOtp} className="space-y-5">
                            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                                Code sent to <span className="font-black text-slate-900 dark:text-white">+91 {phone}</span>
                                <button type="button" onClick={() => { setOtpStep(false); setOtp(""); }} className="ml-2 text-red-500 font-black text-xs hover:underline">
                                    Change
                                </button>
                            </p>

                            <OtpInput value={otp} onChange={setOtp} />

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full app-button app-button-primary rounded-2xl py-4 font-black shadow-lg shadow-red-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-4 h-4" /> Verify & Login</>}
                            </button>

                            <div className="text-center">
                                {countdown.timeLeft > 0 ? (
                                    <p className="text-xs text-slate-500">
                                        Resend in <span className={`font-black tabular-nums ${countdown.timeLeft <= 15 ? "text-red-500" : "text-slate-700 dark:text-slate-200"}`}>{countdown.label}</span>
                                    </p>
                                ) : (
                                    <button type="button" onClick={resendPhoneOtp} disabled={loading} className="flex items-center gap-2 mx-auto text-sm font-black text-red-600 dark:text-red-400 hover:underline disabled:opacity-40">
                                        <RefreshCw className="w-3.5 h-3.5" /> Resend OTP
                                    </button>
                                )}
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* ── EMAIL / PASSWORD TAB ───────────────────────────────────────── */}
            {tab === "email" && (
                <form onSubmit={handleEmailLogin} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            required
                            autoComplete="email"
                            value={emailForm.email}
                            onChange={(e) => { setError(""); setEmailForm({ ...emailForm, email: e.target.value }); }}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-4 rounded-2xl focus:ring-4 focus:ring-red-500/15 focus:border-red-500 outline-none transition font-medium"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Password
                            </label>
                            <Link href="/forgot-password" className="text-xs font-black text-red-600 dark:text-red-400 hover:underline">
                                Forgot?
                            </Link>
                        </div>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                required
                                autoComplete="current-password"
                                value={emailForm.password}
                                onChange={(e) => { setError(""); setEmailForm({ ...emailForm, password: e.target.value }); }}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-4 pr-12 rounded-2xl focus:ring-4 focus:ring-red-500/15 focus:border-red-500 outline-none transition font-medium"
                                placeholder="Enter your password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(!showPw)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                aria-label={showPw ? "Hide password" : "Show password"}
                            >
                                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full app-button app-button-primary rounded-2xl py-4 text-sm sm:text-base font-black shadow-lg shadow-red-500/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sign In →"}
                    </button>
                </form>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    New here?{" "}
                    <Link href="/signup" className="text-red-600 dark:text-red-400 font-black hover:underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}

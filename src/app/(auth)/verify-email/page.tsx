"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MailCheck, RefreshCw, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

// ─── Individual OTP digit boxes ───────────────────────────────────────────────
function OtpInput({ value, onChange }: { value: string; onChange: (val: string) => void }) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [digits, setDigits] = useState(["", "", "", "", "", ""]);

    // Sync external value
    useEffect(() => {
        if (value === "") setDigits(["", "", "", "", "", ""]);
    }, [value]);

    const handleChange = (index: number, char: string) => {
        if (!/^\d?$/.test(char)) return;
        const next = [...digits];
        next[index] = char;
        setDigits(next);
        onChange(next.join(""));
        if (char && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === "Backspace" && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
        if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const next = pasted.split("").concat(["", "", "", "", "", ""]).slice(0, 6);
        setDigits(next);
        onChange(next.join(""));
        const lastFilled = Math.min(pasted.length, 5);
        inputRefs.current[lastFilled]?.focus();
    };

    return (
        <div className="flex gap-2 sm:gap-3 justify-center">
            {digits.map((d, i) => (
                <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 outline-none transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                        ${d ? "border-red-500 bg-red-50 dark:bg-red-900/20 shadow-lg shadow-red-100 dark:shadow-red-900/20" : "border-gray-200 dark:border-gray-700 focus:border-red-400 focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/20"}`}
                />
            ))}
        </div>
    );
}

// ─── Countdown Timer hook ──────────────────────────────────────────────────────
function useCountdown(seconds: number) {
    const [timeLeft, setTimeLeft] = useState(seconds);

    const reset = () => setTimeLeft(seconds);

    useEffect(() => {
        if (timeLeft <= 0) return;
        const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearTimeout(t);
    }, [timeLeft]);

    const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const secs = String(timeLeft % 60).padStart(2, "0");
    return { timeLeft, label: `${mins}:${secs}`, reset };
}

// ─── Main form ─────────────────────────────────────────────────────────────────
function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [verified, setVerified] = useState(false);
    const { timeLeft, label, reset } = useCountdown(120); // 2 minutes countdown

    const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.max(2, b.length)) + c);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error("Please enter all 6 digits.");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Verification failed. Try again.");
                setLoading(false);
                return;
            }
            setVerified(true);
            toast.success("✅ Email verified! Redirecting to login...");
            setTimeout(() => router.push("/login"), 2000);
        } catch {
            toast.error("Something went wrong. Check your connection.");
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (timeLeft > 0) return;
        setResending(true);
        setOtp(""); // clear current input
        try {
            const res = await fetch("/api/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error || "Could not resend OTP.");
            } else {
                toast.success("New OTP sent! Check your inbox.");
                reset();
            }
        } catch {
            toast.error("Something went wrong.");
        } finally {
            setResending(false);
        }
    };

    if (verified) {
        return (
            <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                    <ShieldCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">Account Verified!</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Redirecting you to login...</p>
                <Loader2 className="w-5 h-5 animate-spin text-red-500 mx-auto mt-4" />
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-7">
            <div>
                <label className="block text-center text-sm font-bold text-gray-500 dark:text-gray-400 mb-5">
                    Enter the 6-digit code sent to <span className="text-gray-900 dark:text-white font-black">{maskedEmail}</span>
                </label>
                <OtpInput value={otp} onChange={setOtp} />
            </div>

            <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-red-600 text-white font-black py-4 rounded-2xl hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-red-600/20 disabled:shadow-none"
            >
                {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Verifying...</>
                ) : (
                    <><ShieldCheck className="w-5 h-5" /> Verify Account</>
                )}
            </button>

            {/* Countdown + Resend */}
            <div className="text-center">
                {timeLeft > 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Code expires in{" "}
                        <span className={`font-black tabular-nums ${timeLeft <= 30 ? "text-red-500" : "text-gray-700 dark:text-gray-200"}`}>
                            {label}
                        </span>
                    </p>
                ) : (
                    <p className="text-sm text-red-500 font-bold">Code expired.</p>
                )}

                <button
                    type="button"
                    onClick={handleResend}
                    disabled={timeLeft > 0 || resending}
                    className="mt-3 flex items-center gap-2 mx-auto text-sm font-bold text-red-600 dark:text-red-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                    {resending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    {resending ? "Sending..." : "Resend Code"}
                </button>
            </div>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                ⚠️ Check your spam/junk folder if you don't see the email.
            </p>
        </form>
    );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 relative max-w-md w-full mx-auto">
            <Link
                href="/login"
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-400 dark:text-gray-500"
            >
                <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Logo + Brand */}
            <div className="text-center mb-8 mt-4">
                <div className="flex items-center justify-center gap-3 mb-5">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/30">
                        <Image src="/logo2.png" alt="Mana Delivery" width={48} height={48} className="object-contain" />
                    </div>
                    <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Mana Delivery</span>
                </div>

                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MailCheck className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Check Your Email</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-2 text-sm max-w-xs mx-auto">
                    We've sent a 6-digit verification code. Enter it below to activate your account.
                </p>
            </div>

            <Suspense fallback={
                <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
            }>
                <VerifyEmailForm />
            </Suspense>
        </div>
    );
}

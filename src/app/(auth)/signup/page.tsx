"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Check, X, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import { useSearchParams } from "next/navigation";

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: searchParams.get("email") || "",
        phone: searchParams.get("phone") || "",
        address: "",
        referralCode: "",
        password: "",
        confirmPassword: "",
    });

    const isLengthValid = form.password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(form.password);
    const hasLowerCase = /[a-z]/.test(form.password);
    const hasNumber = /[0-9]/.test(form.password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);
    const isPasswordStrong = isLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSymbol;
    const passwordsMatch = form.password === form.confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (!isPasswordStrong) {
            toast.error("Password does not meet all security requirements.");
            return;
        }
        if (!passwordsMatch) {
            toast.error("Passwords do not match.");
            return;
        }
        if (!/^\d{10}$/.test(form.phone.replace(/\D/g, ""))) {
            toast.error("Please enter a valid 10-digit mobile number.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    password: form.password,
                    phone: form.phone.replace(/\D/g, "").slice(-10),
                    address: form.address,
                    referralCode: form.referralCode,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setErrorMessage(data.error || "Failed to register");
                setLoading(false);
                return;
            }

            toast.success("Account created! Check your email for the verification code.");
            router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
        } catch {
            setErrorMessage("Something went wrong. Please try again.");
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white p-3.5 sm:p-4 rounded-2xl focus:ring-4 focus:ring-red-500/15 focus:border-red-500 outline-none transition font-medium text-sm sm:text-base";

    return (
        <div className="relative w-full rounded-[2rem] sm:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 shadow-2xl backdrop-blur-xl p-5 sm:p-7 md:p-10">
            <Link
                href="/"
                className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
                aria-label="Back to home"
            >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            {/* Logo + Brand */}
            <div className="text-center mb-5 mt-3">
                <div className="flex items-center justify-center gap-2.5 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 flex items-center justify-center flex-shrink-0">
                        <Image src="/logo2.png" alt="Mana Delivery" width={44} height={44} className="object-contain" />
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                        Mana Delivery
                    </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">Create Account</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Join Mana Delivery today</p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-50 dark:bg-rose-900/10 p-3.5 text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        required
                        autoComplete="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={inputClass}
                        placeholder="Your full name"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        required
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className={inputClass}
                        placeholder="you@example.com"
                    />
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Mobile Number
                    </label>
                    <div className="flex rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/15 transition bg-slate-50 dark:bg-slate-900">
                        <span className="flex items-center px-3 text-slate-500 dark:text-slate-400 font-black text-sm border-r border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 flex-shrink-0">
                            🇮🇳 +91
                        </span>
                        <input
                            type="tel"
                            required
                            autoComplete="tel"
                            inputMode="numeric"
                            maxLength={10}
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                            className="flex-1 min-w-0 bg-transparent text-slate-900 dark:text-white px-3.5 py-3.5 sm:py-4 outline-none font-medium text-sm sm:text-base placeholder:text-slate-400"
                            placeholder="9876543210"
                        />
                    </div>
                </div>

                {/* Primary Delivery Address */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Primary Delivery Address (Street / Colony / Landmark)
                    </label>
                    <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className={inputClass}
                        placeholder="House no., Colony, Kagaznagar"
                    />
                </div>

                {/* Referral Code (Optional) */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Referral Code (Optional)
                    </label>
                    <input
                        type="text"
                        value={form.referralCode}
                        onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
                        className={inputClass + " uppercase font-mono"}
                        placeholder="ENTER REFERRAL CODE"
                    />
                </div>

                {/* Password */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            autoComplete="new-password"
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className={inputClass + " pr-12"}
                            placeholder="Create a secure password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {form.password && (
                        <div className="mt-2.5 p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl space-y-1.5 text-xs font-semibold border border-slate-100 dark:border-slate-800">
                            {[
                                [isLengthValid, "At least 8 characters"],
                                [hasUpperCase && hasLowerCase, "Uppercase & lowercase letters"],
                                [hasNumber, "At least 1 number"],
                                [hasSymbol, "At least 1 special character (!@#$)"],
                            ].map(([ok, label]) => (
                                <p key={label as string} className="flex items-center gap-2">
                                    {ok ? <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> : <X className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />}
                                    <span className={ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}>{label as string}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            autoComplete="new-password"
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            className={inputClass + ` pr-12 ${form.confirmPassword && !passwordsMatch ? "border-rose-400 focus:ring-rose-500/15 focus:border-rose-500" : ""}`}
                            placeholder="Re-enter your password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        >
                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                    {form.confirmPassword && !passwordsMatch && (
                        <p className="text-rose-500 text-xs font-bold mt-1.5">Passwords do not match.</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !isPasswordStrong || !passwordsMatch}
                    className="w-full app-button app-button-primary rounded-2xl py-4 text-sm sm:text-base font-black shadow-lg shadow-red-500/20 disabled:opacity-50 mt-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Create Account →"}
                </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Already have an account?{" "}
                    <Link href="/login" className="text-red-600 dark:text-red-400 font-black hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

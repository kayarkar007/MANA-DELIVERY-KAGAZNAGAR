"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Check, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const email = searchParams.get("email") || "";

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    // Strong Password Checker
    const isLengthValid = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isPasswordStrong = isLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSymbol;
    const passwordsMatch = password === confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token || !email) {
            toast.error("Invalid reset link. Please request a new one.");
            return;
        }

        if (!isPasswordStrong) {
            toast.error("Please ensure your password meets all security requirements.");
            return;
        }

        if (!passwordsMatch) {
            toast.error("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, email, newPassword: password }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Failed to reset password");
                setLoading(false);
                return;
            }

            toast.success("Password reset successfully! You can now log in.");
            router.push("/login");

        } catch (error) {
            toast.error("Something went wrong");
            setLoading(false);
        }
    };

    if (!token || !email) {
        return (
            <div className="text-center p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl text-red-600 dark:text-red-400">
                Invalid or missing reset token. Please request a new link.
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">New Secure Password</label>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all font-medium"
                    placeholder="••••••••"
                />
                {password && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-1.5 text-xs font-semibold">
                        <p className="flex items-center gap-2">
                            {isLengthValid ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-gray-400" />} 
                            <span className={isLengthValid ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>At least 8 characters</span>
                        </p>
                        <p className="flex items-center gap-2">
                            {(hasUpperCase && hasLowerCase) ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-gray-400" />} 
                            <span className={(hasUpperCase && hasLowerCase) ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>Uppercase & Lowercase</span>
                        </p>
                        <p className="flex items-center gap-2">
                            {hasNumber ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-gray-400" />} 
                            <span className={hasNumber ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>At least 1 number</span>
                        </p>
                        <p className="flex items-center gap-2">
                            {hasSymbol ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-gray-400" />} 
                            <span className={hasSymbol ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>At least 1 special character (!@#$)</span>
                        </p>
                    </div>
                )}
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full bg-white dark:bg-gray-800 border ${confirmPassword && !passwordsMatch ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 dark:border-gray-700 focus:ring-blue-100'} text-gray-900 dark:text-white p-4 rounded-xl focus:ring-4 outline-none transition-all font-medium`}
                    placeholder="••••••••"
                />
                {confirmPassword && !passwordsMatch && (
                    <p className="text-red-500 text-xs font-bold mt-2">Passwords do not match.</p>
                )}
            </div>

            <button
                type="submit"
                disabled={loading || !isPasswordStrong || !passwordsMatch}
                className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save New Password"}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 relative max-w-md w-full mx-auto">
            <Link
                href="/login"
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
                <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="text-center mb-8 mt-6">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">New Password</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-2 text-sm">
                    Almost there! Enter your new secure password.
                </p>
            </div>

            <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}

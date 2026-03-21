"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Failed to send reset link");
            } else {
                toast.success("Reset link sent!");
                setIsSent(true);
            }
        } catch (error) {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

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
                    <KeyRound className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Reset Password</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-2 text-sm">
                    Enter your email to receive a password reset link.
                </p>
            </div>

            {!isSent ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 focus:border-blue-500 outline-none transition-all font-medium"
                            placeholder="you@example.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !email}
                        className="w-full bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
                    </button>
                </form>
            ) : (
                <div className="text-center bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl">
                    <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Check your inbox</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        If an account exists for <span className="font-bold text-gray-700 dark:text-gray-300">{email}</span>, we've sent a password reset link.
                    </p>
                    <button 
                        onClick={() => setIsSent(false)} 
                        className="mt-6 text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Try a different email
                    </button>
                </div>
            )}
        </div>
    );
}

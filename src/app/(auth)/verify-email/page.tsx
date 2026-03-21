"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function VerifyEmailForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit code.");
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
                toast.error(data.error || "Verification failed");
                setLoading(false);
                return;
            }

            toast.success("Email verified successfully! You can now log in.");
            router.push("/login");

        } catch (error) {
            toast.error("Something went wrong");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">6-Digit Verification Code</label>
                <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // strictly numbers
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 text-center tracking-[0.5em] text-2xl rounded-xl focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-500 outline-none transition-all font-black"
                    placeholder="------"
                />
            </div>

            <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Account"}
            </button>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
                Didn't receive the email? Check your spam folder.
            </p>
        </form>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 relative max-w-md w-full mx-auto">
            <Link
                href="/login"
                className="absolute top-6 left-6 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
                <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="text-center mb-8 mt-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MailCheck className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">Verify your Email</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-2 text-sm">
                    We've sent a 6-digit code to your email address.
                </p>
            </div>

            <Suspense fallback={<div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}>
                <VerifyEmailForm />
            </Suspense>
        </div>
    );
}

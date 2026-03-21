"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: "", password: "" });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await signIn("credentials", {
            redirect: false,
            email: form.email,
            password: form.password,
        });

        if (res?.error) {
            toast.error(res.error);
            setLoading(false);
        } else {
            toast.success("Welcome back!");
            const session = await getSession();
            if (session?.user?.role === "admin") {
                router.push("/admin");
            } else if (session?.user?.role === "rider") {
                router.push("/rider");
            } else {
                router.push("/");
            }
            router.refresh(); // Refresh to catch server-side layout changes
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 md:p-8 lg:p-10 rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 relative transition-colors duration-300">
            <Link
                href="/"
                className="absolute top-4 left-4 sm:top-6 sm:left-6 md:top-8 md:left-8 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500 dark:text-gray-400"
            >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>

            <div className="text-center mb-6 sm:mb-8 md:mb-10 mt-4 sm:mt-6">
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Welcome Back</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 sm:mt-2 text-sm sm:text-base">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-500 outline-none transition-all font-medium"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Password</label>
                        <Link href="/forgot-password" className="text-sm font-bold text-red-600 dark:text-red-400 hover:underline">
                            Forgot Password?
                        </Link>
                    </div>
                    <input
                        type="password"
                        required
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-500 outline-none transition-all font-medium"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                </button>
            </form>

            <p className="text-center mt-8 text-gray-500 dark:text-gray-400 font-medium">
                Don't have an account?{" "}
                <Link href="/signup" className="text-red-600 dark:text-red-400 font-bold hover:underline">
                    Sign up here
                </Link>
            </p>
        </div>
    );
}

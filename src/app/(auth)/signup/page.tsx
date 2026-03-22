"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Check, X, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", whatsapp: "", password: "", confirmPassword: "" });

    // Strong Password Checker
    const isLengthValid = form.password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(form.password);
    const hasLowerCase = /[a-z]/.test(form.password);
    const hasNumber = /[0-9]/.test(form.password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(form.password);
    const isPasswordStrong = isLengthValid && hasUpperCase && hasLowerCase && hasNumber && hasSymbol;
    const passwordsMatch = form.password === form.confirmPassword;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Failed to register");
                setLoading(false);
                return;
            }

            toast.success("Account created! Please check your email for the verification code.");
            
            // Redirect to OTP Verification page
            router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
        } catch (error) {
            toast.error("Something went wrong");
            setLoading(false);
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

            {/* Logo + Brand */}
            <div className="text-center mb-5 sm:mb-7 mt-4 sm:mt-6">
                <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/30">
                        <Image src="/logo2.png" alt="Mana Delivery" width={48} height={48} className="object-contain" />
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                        Mana Delivery
                    </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Create Account</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 sm:mt-2 text-sm sm:text-base">Join Mana Delivery today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                    <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-500 outline-none transition-all font-medium"
                        placeholder="John Doe"
                    />
                </div>

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
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">WhatsApp Number</label>
                    <input
                        type="tel"
                        required
                        value={form.whatsapp}
                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-500 outline-none transition-all font-medium"
                        placeholder="+91 9876543210"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Secure Password</label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={form.password}
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 pr-12 rounded-xl focus:ring-4 focus:ring-red-100 dark:focus:ring-red-900/30 focus:border-red-500 outline-none transition-all font-medium"
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            tabIndex={-1}
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {form.password && (
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-1.5 text-xs font-semibold">
                            <p className="flex items-center gap-2">
                                {isLengthValid ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-gray-400" />} 
                                <span className={isLengthValid ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>At least 8 characters</span>
                            </p>
                            <p className="flex items-center gap-2">
                                {(hasUpperCase && hasLowerCase) ? <Check className="w-3.5 h-3.5 text-green-500" /> : <X className="w-3.5 h-3.5 text-gray-400" />} 
                                <span className={(hasUpperCase && hasLowerCase) ? "text-green-600 dark:text-green-400" : "text-gray-500 dark:text-gray-400"}>Uppercase & Lowercase letters</span>
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
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                    <div className="relative">
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={form.confirmPassword}
                            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                            className={`w-full bg-white dark:bg-gray-800 border ${form.confirmPassword && !passwordsMatch ? 'border-red-400 focus:ring-red-100' : 'border-gray-200 dark:border-gray-700 focus:ring-red-100'} text-gray-900 dark:text-white p-4 pr-12 rounded-xl focus:ring-4 outline-none transition-all font-medium`}
                            placeholder="••••••••"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            tabIndex={-1}
                        >
                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    {form.confirmPassword && !passwordsMatch && (
                        <p className="text-red-500 text-xs font-bold mt-2">Passwords do not match.</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading || !isPasswordStrong || !passwordsMatch}
                    className="w-full bg-red-600 text-white font-black py-4 rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
                </button>
            </form>

            <p className="text-center mt-8 text-gray-500 dark:text-gray-400 font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-red-600 dark:text-red-400 font-bold hover:underline">
                    Log in here
                </Link>
            </p>
        </div>
    );
}

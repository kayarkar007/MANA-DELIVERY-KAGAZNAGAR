"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, LogOut, User as UserIcon, ShieldAlert, Package, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import * as motion from "framer-motion/client";
import { useSession, signOut } from "next-auth/react";

import { useTheme } from "next-themes";

export default function Header({ onCartClick }: { onCartClick: () => void }) {
    const { cart } = useCart();
    const { data: session } = useSession();
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isDark = resolvedTheme === "dark";
    // Render a single icon until mounted so server and client HTML match (avoids hydration mismatch)
    const ThemeIcon = mounted && isDark ? Sun : Moon;

    return (
        <header className="sticky top-0 z-50 w-full glass-card border-b border-white/10 shadow-lg">
            <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform duration-300"
                >
                    <motion.div 
                        whileHover={{ rotate: 10 }}
                        className="flex items-center justify-center p-1.5 sm:p-2 bg-white/10 rounded-xl sm:rounded-2xl shadow-inner border border-white/20"
                    >
                        <Image
                            src="/logo.png"
                            alt="Localu Logo"
                            width={32}
                            height={32}
                            className="w-7 h-7 sm:w-9 sm:h-9 object-contain drop-shadow-md"
                            priority
                        />
                    </motion.div>
                    <span className="text-lg sm:text-2xl md:text-2xl font-black tracking-tighter text-gradient">
                        MANA DELIVERY
                    </span>
                </Link>

                <div className="flex items-center gap-2 sm:gap-5">
                    {session ? (
                        <div className="flex items-center gap-1.5 sm:gap-2 mr-1 sm:mr-2">
                            {session.user.role === "admin" && (
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-500/10 text-red-500 text-[10px] sm:text-xs font-black hover:bg-red-500 hover:text-white transition-all duration-300 border border-red-500/20 shadow-lg shadow-red-500/20"
                                >
                                    <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="hidden xs:inline">Admin</span>
                                    <span className="hidden sm:inline"> Panel</span>
                                </Link>
                            )}
                            {session.user.role === "rider" && (
                                <Link
                                    href="/rider"
                                    className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] sm:text-xs font-black hover:bg-emerald-500 hover:text-white transition-all duration-300 border border-emerald-500/20 shadow-lg shadow-emerald-500/20"
                                >
                                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                    <span className="hidden xs:inline">Rider</span>
                                </Link>
                            )}
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-inner">
                                <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">
                                    Hey, {session.user.name?.split(" ")[0] || "User"}
                                </span>
                            </div>
                            <Link
                                href="/profile"
                                className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300 border border-red-500/20 shadow-lg shadow-red-500/20"
                                title="My Orders"
                            >
                                <Package className="w-4 h-4" />
                                <span className="text-xs font-black uppercase tracking-wider">Orders</span>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                aria-label="Sign Out"
                                className="p-2 sm:p-2.5 rounded-full hover:bg-red-500/10 text-slate-500 dark:text-slate-400 hover:text-red-500 transition-all duration-300"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Mobile: keep header compact */}
                            <Link
                                href="/login"
                                className="sm:hidden p-3 rounded-full hover:bg-red-500/10 text-slate-600 dark:text-slate-300 transition-colors"
                                title="Log in"
                            >
                                <UserIcon className="w-6 h-6" />
                            </Link>

                            {/* >= sm: show full auth CTAs */}
                            <div className="hidden sm:flex items-center gap-3 mr-3">
                                <Link href="/login" className="text-sm font-black text-slate-600 dark:text-slate-400 hover:text-red-600 transition-colors px-3 uppercase tracking-widest">
                                    Log in
                                </Link>
                                <Link href="/signup" className="text-sm font-black bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-950/20 uppercase tracking-widest">
                                    Join Now
                                </Link>
                            </div>
                        </>
                    )}
                    {/* Theme Toggle */}
                    <button
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        aria-label="Toggle Theme"
                        className="p-2.5 rounded-full hover:bg-amber-500/10 text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-all duration-300"
                        title="Toggle Theme"
                    >
                        <ThemeIcon className="w-5 h-5" />
                    </button>
                    {/* Cart Toggle */}
                    <button
                        onClick={onCartClick}
                        aria-label="Open Shopping Cart"
                        className="relative flex items-center justify-center rounded-full p-2.5 bg-red-600 text-white hover:bg-red-700 hover:scale-110 active:scale-90 transition-all shadow-lg shadow-red-600/30"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        {itemCount > 0 && (
                            <motion.span
                                key={itemCount}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-xl border-2 border-white dark:border-slate-900"
                            >
                                {itemCount}
                            </motion.span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, LogOut, User as UserIcon, ShieldAlert, Package, Sun, Moon, Wallet } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import * as motion from "framer-motion/client";
import { useTheme } from "next-themes";
import { useCart } from "@/context/CartContext";
import NotificationBell from "@/components/NotificationBell";

export default function Header({ onCartClick }: { onCartClick: () => void }) {
    const { cart } = useCart();
    const { data: session } = useSession();
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const isDark = resolvedTheme === "dark";
    const ThemeIcon = mounted && isDark ? Sun : Moon;

    return (
        <header className="sticky z-50 px-2.5 sm:px-4" style={{ top: "env(safe-area-inset-top)", paddingTop: "max(0.625rem, env(safe-area-inset-top))" }}>
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 rounded-[1.75rem] border border-[rgba(214,160,70,0.14)] bg-[rgba(14,6,8,0.78)] px-2.5 py-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.34)] backdrop-blur-2xl sm:gap-3 sm:rounded-[2rem] sm:px-5 sm:py-3">
                <Link href="/" className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
                    <motion.div
                        whileHover={{ rotate: 8, scale: 1.04 }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[rgba(214,160,70,0.22)] bg-[linear-gradient(135deg,rgba(214,160,70,0.24),rgba(225,58,50,0.18))] p-0.5 shadow-lg sm:h-11 sm:w-11 sm:rounded-2xl"
                    >
                        <Image
                            src="/logo2.png"
                            alt="Mana Delivery"
                            width={40}
                            height={40}
                            className="h-full w-full rounded-[0.9rem] object-cover"
                            priority
                        />
                    </motion.div>
                    <div className="min-w-0">
                        <p className="font-display truncate text-[0.92rem] font-black uppercase tracking-[0.1em] text-white sm:text-xl sm:tracking-[0.12em]">
                            <span className="sm:hidden">Mana</span>
                            <span className="hidden sm:inline">Mana Delivery</span>
                        </p>
                        <p className="hidden text-[11px] font-black uppercase tracking-[0.22em] text-[#caa898] sm:block">
                            Hyperlocal essentials and services
                        </p>
                    </div>
                </Link>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                    {session ? (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <div className="hidden items-center gap-2 rounded-full border border-[rgba(214,160,70,0.14)] bg-[rgba(255,255,255,0.05)] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#d6c0b6] shadow-sm md:flex">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                {session.user.name?.split(" ")[0] || "User"}
                            </div>

                            {session.user.role === "admin" && (
                                <Link href="/admin" className="app-button app-button-secondary hidden md:inline-flex">
                                    <ShieldAlert className="h-4 w-4 text-red-500" />
                                    Admin
                                </Link>
                            )}

                            {session.user.role === "rider" && (
                                <Link href="/rider" className="app-button app-button-secondary hidden md:inline-flex">
                                    <Package className="h-4 w-4 text-emerald-500" />
                                    Rider
                                </Link>
                            )}

                            <Link href="/profile" className="app-icon-button hidden md:inline-flex" title="Orders">
                                <Package className="h-4 w-4" />
                            </Link>
                            <Link href="/profile/wallet" className="app-icon-button hidden md:inline-flex" title="Wallet">
                                <Wallet className="h-4 w-4" />
                            </Link>
                            <NotificationBell />
                            <button
                                onClick={() => signOut()}
                                aria-label="Sign Out"
                                className="app-icon-button hidden md:inline-flex"
                                title="Sign Out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/login"
                                className="app-icon-button h-10 w-10 sm:hidden"
                                title="Log in"
                            >
                                <UserIcon className="h-5 w-5" />
                            </Link>
                            <div className="hidden items-center gap-2 sm:flex">
                                <Link href="/login" className="app-button app-button-secondary">
                                    Log In
                                </Link>
                                <Link href="/signup" className="app-button app-button-primary">
                                    Join Now
                                </Link>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        aria-label="Toggle Theme"
                        className="app-icon-button h-10 w-10 sm:h-[2.9rem] sm:w-[2.9rem]"
                        title="Toggle Theme"
                    >
                        <ThemeIcon className="h-5 w-5" />
                    </button>

                    <button
                        onClick={onCartClick}
                        aria-label="Open Shopping Cart"
                        className="relative inline-flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-white shadow-[0_18px_40px_rgba(123,15,19,0.42)] sm:h-12 sm:w-12 sm:rounded-[1.25rem]"
                    >
                        <ShoppingCart className="h-5 w-5" />
                        {itemCount > 0 && (
                            <motion.span
                                key={itemCount}
                                initial={{ scale: 0.75, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="absolute -right-1.5 -top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-slate-950 px-1 text-[10px] font-black text-white dark:border-slate-950 dark:bg-white dark:text-slate-950"
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

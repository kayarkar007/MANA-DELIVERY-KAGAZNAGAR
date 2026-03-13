"use client";

import Link from "next/link";
import { ShoppingCart, LogOut, User as UserIcon, ShieldAlert, Package, Store, Sun, Moon } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/context/CartContext";
import * as motion from "framer-motion/client";
import { useSession, signOut } from "next-auth/react";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function Header({ onCartClick }: { onCartClick: () => void }) {
    const { cart } = useCart();
    const { data: session } = useSession();
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    return (
        <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md shadow-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <div className="flex items-center justify-center p-1 bg-white/50 dark:bg-gray-800/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <Image
                            src="/logo.png"
                            alt="Localu Logo"
                            width={32}
                            height={32}
                            className="w-8 h-8 object-contain"
                            priority
                        />
                    </div>
                    <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                        LOCALU
                    </span>
                </Link>

                <div className="flex items-center gap-3">
                    {session ? (
                        <div className="flex items-center gap-2 mr-2">
                            {session.user.role === "admin" && (
                                <Link
                                    href="/admin"
                                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold hover:bg-red-200 transition-colors"
                                >
                                    <ShieldAlert className="w-3.5 h-3.5" /> Admin Panel
                                </Link>
                            )}
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Hey, {session.user.name?.split(" ")[0]}
                                </span>
                            </div>
                            <Link
                                href="/profile"
                                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                                title="My Orders"
                            >
                                <Package className="w-4 h-4" />
                                <span className="text-xs font-bold">My Orders</span>
                            </Link>
                            <button
                                onClick={() => signOut()}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 mr-2">
                            <Link href="/login" className="text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors px-2">
                                Log in
                            </Link>
                            <Link href="/signup" className="text-sm font-bold bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-md">
                                Sign up
                            </Link>
                        </div>
                    )}
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
                            title="Toggle Theme"
                        >
                            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    )}
                    <button
                        onClick={onCartClick}
                        className="relative flex items-center justify-center rounded-full p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ShoppingCart className="h-5 w-5 text-gray-800 dark:text-gray-200" />
                        {itemCount > 0 && (
                            <motion.span
                                key={itemCount}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm shadow-red-500/50"
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

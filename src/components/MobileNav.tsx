"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, ShoppingBag, User, Truck, ShieldAlert, Users, Package, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Hide mobile nav on admin/rider routes (they have their own navigation)
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/rider")) return null;

    // ── ADMIN NAV ──
    if (session?.user.role === "admin") {
        const adminNav = [
            { label: "Dashboard", icon: LayoutDashboard, href: "/admin" },
            { label: "Orders", icon: ShoppingBag, href: "/admin/orders" },
            { label: "Products", icon: Package, href: "/admin/products" },
            { label: "Users", icon: Users, href: "/admin/users" },
            { label: "Profile", icon: User, href: "/profile" },
        ];

        return (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-t border-red-100 dark:border-red-900/20 pb-safe shadow-[0_-10px_40px_rgba(239,68,68,0.08)]">
                <div className="flex items-center justify-around h-16 px-1">
                    {adminNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = item.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(item.href);
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300",
                                    isActive ? "text-red-600 dark:text-red-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                {isActive && (
                                    <motion.div layoutId="admin-nav-bg" className="absolute top-1 inset-x-1 h-10 rounded-2xl bg-red-50 dark:bg-red-900/20" />
                                )}
                                <div className="relative z-10">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className={cn("relative z-10 text-[9px] font-black uppercase tracking-wider", isActive ? "opacity-100" : "opacity-50")}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div layoutId="admin-nav-dot" className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-red-500 rounded-b-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        );
    }

    // ── RIDER NAV ──
    if (session?.user.role === "rider") {
        const riderNav = [
            { label: "Dashboard", icon: Truck, href: "/rider" },
            { label: "Orders", icon: ShoppingBag, href: "/profile" },
            { label: "Profile", icon: User, href: "/profile" },
        ];

        return (
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl border-t border-emerald-100 dark:border-emerald-900/20 pb-safe shadow-[0_-10px_40px_rgba(16,185,129,0.08)]">
                <div className="flex items-center justify-around h-16 px-4">
                    {riderNav.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-300",
                                    isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                )}
                            >
                                {isActive && (
                                    <motion.div layoutId="rider-nav-bg" className="absolute top-1 inset-x-1 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20" />
                                )}
                                <div className="relative z-10"><Icon className="w-5 h-5" /></div>
                                <span className={cn("relative z-10 text-[9px] font-black uppercase tracking-wider", isActive ? "opacity-100" : "opacity-50")}>
                                    {item.label}
                                </span>
                                {isActive && (
                                    <motion.div layoutId="rider-nav-dot" className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-emerald-500 rounded-b-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        );
    }

    // ── CUSTOMER NAV ──
    const customerNav = [
        { label: "Home", icon: Home, href: "/" },
        { label: "Search", icon: Search, href: "/search" },
        { label: "Orders", icon: ShoppingBag, href: "/profile" },
        { label: "Profile", icon: User, href: "/profile" },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl border-t border-white/10 pb-safe rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-around h-20 px-4">
                {customerNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1.5 w-full h-full transition-all duration-500",
                                isActive ? "text-red-600 dark:text-red-400 -translate-y-2" : "text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                            )}
                        >
                            <div className={cn("p-2 rounded-2xl transition-all duration-500", isActive && "bg-red-600 text-white shadow-lg shadow-red-500/40")}>
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className={cn("text-[9px] font-black uppercase tracking-[0.1em] transition-all", isActive ? "opacity-100" : "opacity-60")}>
                                {item.label}
                            </span>
                            {isActive && (
                                <motion.div layoutId="nav-dot" className="absolute -bottom-1 w-1 h-1 rounded-full bg-red-600 dark:bg-red-400 shadow-[0_0_10px_#2563eb]" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

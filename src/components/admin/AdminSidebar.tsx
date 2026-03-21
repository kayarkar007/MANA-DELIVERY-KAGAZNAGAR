"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CopyPlus, LayoutDashboard, ShoppingCart, FileText, ArrowLeft, Menu, X, Users, Tag, TrendingUp, Navigation, LogOut } from "lucide-react";
import PendingOrderBadge from "@/components/admin/PendingOrderBadge";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const navItems = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Categories", href: "/admin/categories", icon: CopyPlus },
        { label: "Products", href: "/admin/products", icon: ShoppingCart },
        { label: "Orders", href: "/admin/orders", icon: FileText, badge: <PendingOrderBadge /> },
        { label: "Promo", href: "/admin/promo", icon: Tag },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Analytics", href: "/admin/analytics", icon: TrendingUp },
        { label: "Tracking", href: "/admin/live-tracking", icon: Navigation },
    ];

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin";
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* ─── MOBILE TOP BAR (< lg) ─── */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-sm">
                <Link href="/admin" className="flex items-center gap-2 font-black text-lg bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    <Image src="/logo.png" alt="Localu" width={26} height={26} className="object-contain" priority />
                    LOCALU <span className="text-gray-400 font-medium text-xs ml-1">Admin</span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* ─── MOBILE DRAWER (< lg) ─── */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
            <div className={cn(
                "lg:hidden fixed top-14 left-0 bottom-0 z-50 w-72 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col transition-transform duration-300 shadow-2xl",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-4 border-b dark:border-gray-800">
                    <Link
                        href="/"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to App
                    </Link>
                </div>
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 p-3.5 rounded-2xl font-bold transition-colors text-sm",
                                    isActive(item.href)
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                )}
                            >
                                <Icon className="w-5 h-5" /> {item.label} {item.badge}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-sm">A</div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Admin User</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">admin@localu.com</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ─── MOBILE BOTTOM NAV (< lg) ─── */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-stretch h-16 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
                {navItems.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors relative",
                                active ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"
                            )}
                        >
                            {active && <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-b-full" />}
                            <Icon className="w-5 h-5" />
                            <span className="truncate max-w-full px-1">{item.label}</span>
                            {item.badge && (
                                <span className="absolute top-2 right-1/4 translate-x-1/2">{item.badge}</span>
                            )}
                        </Link>
                    );
                })}
                {/* "More" button opens drawer for remaining items */}
                <button
                    onClick={() => setIsOpen(true)}
                    className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors",
                        "text-gray-400 dark:text-gray-500"
                    )}
                >
                    <Menu className="w-5 h-5" />
                    <span>More</span>
                </button>
            </nav>

            {/* ─── DESKTOP SIDEBAR (≥ lg) ─── */}
            <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-900 border-r dark:border-gray-800 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                <div className="p-6 border-b dark:border-gray-800 flex flex-col gap-4">
                    <Link
                        href="/"
                        className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-2 text-sm font-bold transition-colors w-fit"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to App
                    </Link>
                    <Link
                        href="/admin"
                        className="flex items-center gap-2 text-2xl font-black bg-linear-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
                    >
                        <Image src="/logo.png" alt="Localu Logo" width={32} height={32} className="object-contain" priority />
                        LOCALU
                    </Link>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 p-4 rounded-2xl font-bold transition-colors",
                                    isActive(item.href)
                                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-700 dark:hover:text-blue-400"
                                )}
                            >
                                <Icon className="w-5 h-5" /> {item.label} {item.badge}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-4 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">A</div>
                            <div>
                                <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Admin User</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate w-32">admin@localu.com</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                            title="Sign Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}

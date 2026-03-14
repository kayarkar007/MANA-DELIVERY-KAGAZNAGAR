"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CopyPlus, LayoutDashboard, ShoppingCart, FileText, ArrowLeft, Menu, X, Users, Tag } from "lucide-react";
import PendingOrderBadge from "@/components/admin/PendingOrderBadge";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);

    const navItems = [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Categories", href: "/admin/categories", icon: CopyPlus },
        { label: "Products", href: "/admin/products", icon: ShoppingCart },
        { label: "Orders", href: "/admin/orders", icon: FileText, badge: <PendingOrderBadge /> },
        { label: "Promo Codes", href: "/admin/promo", icon: Tag },
        { label: "Users", href: "/admin/users", icon: Users },
    ];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-lg text-gray-600 dark:text-gray-400"
            >
                {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Backdrop */}
            {isOpen && (
                <div 
                    className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed lg:static inset-y-0 left-0 z-45 w-72 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 transform lg:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
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
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 p-4 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-800 hover:text-blue-700 dark:hover:text-blue-400 rounded-2xl font-bold transition-colors"
                            >
                                <Icon className="w-5 h-5" /> {item.label} {item.badge}
                            </Link>
                        );
                    })}
                </nav>
                <div className="p-6 border-t dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">
                            A
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100 text-sm">Admin User</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis">admin@superapp.com</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}

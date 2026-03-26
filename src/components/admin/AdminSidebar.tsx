"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
    CopyPlus,
    LayoutDashboard,
    ShoppingCart,
    FileText,
    ArrowLeft,
    Menu,
    X,
    Users,
    Tag,
    TrendingUp,
    Navigation,
    LogOut,
    MessageSquare,
    MessageSquareQuote,
} from "lucide-react";
import PendingOrderBadge from "@/components/admin/PendingOrderBadge";
import NotificationBell from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

const navItems = [
    { label: "Dashboard", mobileLabel: "Home", href: "/admin", icon: LayoutDashboard },
    { label: "Categories", mobileLabel: "Cats", href: "/admin/categories", icon: CopyPlus },
    { label: "Products", mobileLabel: "Items", href: "/admin/products", icon: ShoppingCart },
    { label: "Orders", mobileLabel: "Orders", href: "/admin/orders", icon: FileText, badge: <PendingOrderBadge /> },
    { label: "Promo", mobileLabel: "Promo", href: "/admin/promo", icon: Tag },
    { label: "Users", mobileLabel: "Users", href: "/admin/users", icon: Users },
    { label: "Support", mobileLabel: "Help", href: "/admin/support", icon: MessageSquare },
    { label: "Reviews", mobileLabel: "Reviews", href: "/admin/reviews", icon: MessageSquareQuote },
    { label: "Analytics", mobileLabel: "Stats", href: "/admin/analytics", icon: TrendingUp },
    { label: "Tracking", mobileLabel: "Track", href: "/admin/live-tracking", icon: Navigation },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

    const renderNavLinks = (compact = false) =>
        navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
                <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                        "group relative flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-black transition",
                        active
                            ? "bg-[linear-gradient(135deg,rgba(198,40,40,0.2),rgba(214,160,70,0.12))] text-white shadow-sm"
                            : "text-[#b89b92] hover:bg-white/5 hover:text-white"
                    )}
                >
                    <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-2xl border transition",
                        active
                            ? "border-[rgba(214,160,70,0.18)] bg-[rgba(255,255,255,0.08)]"
                            : "border-transparent bg-[rgba(255,255,255,0.04)]"
                    )}>
                        <Icon className="h-5 w-5" />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    {!compact && item.badge}
                </Link>
            );
        });

    return (
        <>
            <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-[rgba(214,160,70,0.14)] bg-[rgba(10,4,6,0.9)] px-3 shadow-sm backdrop-blur-2xl lg:hidden">
                <Link href="/admin" className="flex min-w-0 flex-1 items-center gap-2.5 pr-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-[rgba(214,160,70,0.22)] bg-[linear-gradient(135deg,rgba(214,160,70,0.24),rgba(225,58,50,0.18))] p-0.5 shadow-lg">
                        <Image src="/logo2.png" alt="Mana Delivery" width={40} height={40} className="h-full w-full rounded-[0.9rem] object-cover" priority />
                    </div>
                    <div className="min-w-0">
                        <p className="font-display truncate text-sm font-black uppercase tracking-[0.1em] text-white">Mana Admin</p>
                        <p className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-[#b89b92]">Control Panel</p>
                    </div>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                    <NotificationBell />
                    <button onClick={() => setIsOpen((value) => !value)} className="app-icon-button h-10 w-10 shrink-0" aria-label="Toggle admin navigation">
                        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {isOpen && <div className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setIsOpen(false)} />}

            <aside
                className={cn(
                    "fixed left-0 top-14 z-50 flex w-72 flex-col border-r border-[rgba(214,160,70,0.14)] bg-[rgba(9,4,5,0.94)] shadow-[0_16px_50px_rgba(0,0,0,0.34)] backdrop-blur-3xl transition-transform lg:static lg:top-0 lg:z-0 lg:h-screen lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <div className="border-b border-[rgba(214,160,70,0.14)] p-5">
                    <Link href="/" className="mb-4 flex items-center gap-2 text-sm font-black text-[#b89b92] transition hover:text-white">
                        <ArrowLeft className="h-4 w-4" />
                        Back to app
                    </Link>
                    <div className="rounded-[1.75rem] border border-[rgba(214,160,70,0.16)] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016_80%,#d6a046_118%)] p-4 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)]">
                                <Image src="/logo2.png" alt="Mana Delivery" width={34} height={34} className="object-contain" priority />
                            </div>
                            <div>
                                <p className="font-display text-lg font-black uppercase tracking-[0.14em]">Mana Delivery</p>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Operations console</p>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto p-4">{renderNavLinks()}</nav>

                <div className="border-t border-[rgba(214,160,70,0.14)] p-4">
                    <div className="rounded-[1.5rem] border border-[rgba(214,160,70,0.14)] bg-[rgba(255,255,255,0.04)] p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 font-black text-red-600 dark:text-red-300">
                                    A
                                </div>
                                <div>
                                    <p className="text-sm font-black text-white">Mana Admin</p>
                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#b89b92]">Control center</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <NotificationBell />
                                <button onClick={() => signOut({ callbackUrl: "/login" })} className="app-icon-button h-10 w-10" title="Sign Out">
                                    <LogOut className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            <nav className="fixed inset-x-0 bottom-0 z-40 flex h-[4.75rem] items-center border-t border-[rgba(214,160,70,0.14)] bg-[rgba(10,4,6,0.92)] px-2 pb-[max(0.15rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,0.32)] backdrop-blur-2xl lg:hidden">
                {navItems.slice(0, 5).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "relative flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-[0.18em]",
                                active ? "text-white" : "text-[#9b7d77]"
                            )}
                        >
                            {active && <div className="absolute inset-x-4 top-0 h-0.5 rounded-b-full bg-red-500" />}
                            <Icon className="h-5 w-5" />
                            <span className="max-w-[4.2rem] truncate whitespace-nowrap text-center text-[9px] leading-none tracking-[0.12em]">
                                {item.mobileLabel ?? item.label}
                            </span>
                        </Link>
                    );
                })}
                <button onClick={() => setIsOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#9b7d77]">
                    <Menu className="h-5 w-5" />
                    <span className="max-w-[4.2rem] truncate whitespace-nowrap text-center text-[9px] leading-none">More</span>
                </button>
            </nav>
        </>
    );
}

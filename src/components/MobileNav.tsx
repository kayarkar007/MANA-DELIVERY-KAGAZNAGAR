"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Home, Search, ShoppingBag, User, Truck, ShieldAlert, LayoutDashboard } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
    label: string;
    href: string;
    icon: ComponentType<{ className?: string }>;
};

function getNavItems(role?: string): NavItem[] {
    if (role === "admin") {
        return [
            { label: "Admin", href: "/admin", icon: LayoutDashboard },
            { label: "Orders", href: "/admin/orders", icon: ShoppingBag },
            { label: "Users", href: "/admin/users", icon: ShieldAlert },
            { label: "Profile", href: "/profile", icon: User },
        ];
    }

    if (role === "rider") {
        return [
            { label: "Rider", href: "/rider", icon: Truck },
            { label: "Orders", href: "/profile", icon: ShoppingBag },
            { label: "Profile", href: "/profile", icon: User },
        ];
    }

    return [
        { label: "Home", href: "/", icon: Home },
        { label: "Search", href: "/search", icon: Search },
        { label: "Orders", href: "/profile", icon: ShoppingBag },
        { label: "Profile", href: "/profile", icon: User },
    ];
}

export default function MobileNav() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const hideNav =
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/rider") ||
        pathname === "/checkout" ||
        pathname?.startsWith("/track") ||
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password" ||
        pathname === "/verify-email";

    if (hideNav) return null;

    const navItems = getNavItems(session?.user.role);

    return (
        <nav
            className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2 md:hidden"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            aria-label="Main navigation"
        >
            <div className="mx-auto flex h-[4.75rem] max-w-xl items-center justify-around rounded-[2rem] border border-[rgba(214,160,70,0.14)] bg-[rgba(14,6,8,0.88)] shadow-[0_-18px_50px_rgba(0,0,0,0.35)] backdrop-blur-3xl">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            aria-label={item.label}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                                // 44px minimum touch target (WCAG 2.5.8)
                                "relative flex h-full flex-1 flex-col items-center justify-center gap-1 rounded-[1.35rem] transition",
                                isActive ? "text-white" : "text-[#9b7d77]",
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active"
                                    className="absolute inset-1 rounded-[1.2rem] bg-[linear-gradient(135deg,rgba(198,40,40,0.18),rgba(214,160,70,0.12))]"
                                />
                            )}
                            <div className={cn(
                                "relative z-10 flex h-9 w-9 items-center justify-center rounded-xl transition",
                                isActive && "bg-[rgba(255,255,255,0.08)] text-white shadow-sm shadow-black/20"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            {/* 11px minimum readable size — replaces 9px which was too small */}
                            <span className="relative z-10 w-full truncate text-center text-[10px] font-black uppercase leading-none tracking-[0.1em]">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

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

    if (pathname?.startsWith("/admin") || pathname?.startsWith("/rider")) return null;

    const navItems = getNavItems(session?.user.role);

    return (
        <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-3 pt-2 md:hidden">
            <div className="mx-auto flex h-[4.85rem] max-w-xl items-center justify-around rounded-[2rem] border border-[rgba(214,160,70,0.14)] bg-[rgba(14,6,8,0.82)] px-2 pb-[max(0.15rem,env(safe-area-inset-bottom))] shadow-[0_-18px_50px_rgba(0,0,0,0.35)] backdrop-blur-3xl">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href);

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "relative flex h-full flex-1 flex-col items-center justify-center gap-1.5 rounded-[1.35rem] text-[10px] font-black uppercase tracking-[0.18em] transition",
                                isActive ? "text-white" : "text-[#9b7d77]",
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobile-nav-active"
                                    className="absolute inset-1 rounded-[1.3rem] bg-[linear-gradient(135deg,rgba(198,40,40,0.18),rgba(214,160,70,0.12))]"
                                />
                            )}
                            <div className={cn(
                                "relative z-10 flex h-10 w-10 items-center justify-center rounded-2xl transition",
                                isActive && "bg-[rgba(255,255,255,0.08)] text-white shadow-lg shadow-black/20"
                            )}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <span className="relative z-10 max-w-[4.4rem] truncate whitespace-nowrap text-center text-[9px] font-black uppercase leading-none tracking-[0.12em]">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

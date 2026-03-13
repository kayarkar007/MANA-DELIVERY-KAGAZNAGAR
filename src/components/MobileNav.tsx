"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileNav() {
    const pathname = usePathname();

    const navItems = [
        { label: "Home", icon: Home, href: "/" },
        { label: "Search", icon: Search, href: "/search" },
        { label: "Orders", icon: ShoppingBag, href: "/profile" },
        { label: "Profile", icon: "/profile", iconComp: User, href: "/profile" },
    ];

    // Hide mobile nav in admin routes
    if (pathname.startsWith("/admin")) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe">
            <div className="flex items-center justify-around h-16">
                {navItems.map((item) => {
                    const Icon = item.iconComp || item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                                isActive 
                                    ? "text-blue-600 dark:text-blue-400" 
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                            )}
                        >
                            <Icon className={cn("w-5 h-5", isActive && "fill-blue-600/10")} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                            {isActive && (
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}

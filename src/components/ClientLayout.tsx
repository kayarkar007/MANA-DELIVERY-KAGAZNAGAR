"use client";

import React, { useState } from "react";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import FloatingCart from "./FloatingCart";
import MobileNav from "./MobileNav";
import { CartProvider } from "@/context/CartContext";
import { usePathname } from "next/navigation";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const pathname = usePathname();

    // Admin and Rider pages have their own layout — skip customer chrome
    const isAdminRoute = pathname?.startsWith("/admin");
    const isRiderRoute = pathname?.startsWith("/rider");
    const isSpecialRoute = isAdminRoute || isRiderRoute;

    if (isSpecialRoute) {
        // No customer header, no cart, no mobile nav — just the page content
        return <>{children}</>;
    }

    return (
        <CartProvider>
            <div className="app-shell flex min-h-screen flex-col text-slate-900 dark:text-slate-100 transition-colors duration-300">
                <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(198,40,40,0.22),transparent_50%)]" />
                <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_bottom_right,rgba(214,160,70,0.12),transparent_42%)]" />
                <Header onCartClick={() => setIsCartOpen(true)} />
                <main id="main-content" className="app-page flex-1 pb-24 sm:pb-28 md:pb-16">
                    {children}
                </main>
                <FloatingCart onCartClick={() => setIsCartOpen(true)} />
                <MobileNav />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
        </CartProvider>
    );
}

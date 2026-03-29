"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import FloatingCart from "./FloatingCart";
import MobileNav from "./MobileNav";
import PwaInstallPrompt from "./PwaInstallPrompt";
import { CartProvider } from "@/context/CartContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);
    const pathname = usePathname();

    const isAdminRoute = pathname?.startsWith("/admin");
    const isRiderRoute = pathname?.startsWith("/rider");
    const isSpecialRoute = isAdminRoute || isRiderRoute;

    if (isSpecialRoute) {
        return <>{children}</>;
    }

    return (
        <CartProvider>
            <div className="app-shell flex min-h-screen flex-col text-slate-900 dark:text-slate-100 transition-colors duration-300">
                <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top,rgba(198,40,40,0.22),transparent_50%)]" />
                <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_bottom_right,rgba(214,160,70,0.12),transparent_42%)]" />
                <Header onCartClick={() => setIsCartOpen(true)} />
                <PwaInstallPrompt />
                <main id="main-content" className="app-page flex-1 pb-[calc(5.75rem+env(safe-area-inset-bottom))] sm:pb-24 md:pb-16">
                    {children}
                </main>
                <FloatingCart onCartClick={() => setIsCartOpen(true)} />
                <MobileNav />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
        </CartProvider>
    );
}

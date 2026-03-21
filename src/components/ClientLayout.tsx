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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans selection:bg-red-200 dark:selection:bg-red-900 transition-colors duration-300">
                <Header onCartClick={() => setIsCartOpen(true)} />
                <main className="flex-1 w-full max-w-5xl mx-auto px-3 py-6 sm:px-4 sm:py-8 md:py-12 pb-20 sm:pb-24 md:pb-12">
                    {children}
                </main>
                <FloatingCart onCartClick={() => setIsCartOpen(true)} />
                <MobileNav />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
        </CartProvider>
    );
}

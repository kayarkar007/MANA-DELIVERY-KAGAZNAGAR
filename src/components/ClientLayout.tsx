"use client";

import React, { useState } from "react";
import Header from "./Header";
import CartDrawer from "./CartDrawer";
import FloatingCart from "./FloatingCart";
import MobileNav from "./MobileNav";
import { CartProvider } from "@/context/CartContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <CartProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans selection:bg-blue-200 dark:selection:bg-blue-900 transition-colors duration-300">
                <Header onCartClick={() => setIsCartOpen(true)} />
                <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12 pb-24 md:pb-12">
                    {children}
                </main>
                <FloatingCart onCartClick={() => setIsCartOpen(true)} />
                <MobileNav />
                <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
        </CartProvider>
    );
}

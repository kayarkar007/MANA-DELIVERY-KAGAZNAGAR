"use client";

import { useCart } from "@/context/CartContext";
import { ShoppingCart } from "lucide-react";
import * as motion from "framer-motion/client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function FloatingCart({ onCartClick }: { onCartClick: () => void }) {
    const { cart } = useCart();
    const itemCount = cart.reduce((total, item) => total + item.quantity, 0);
    const [isVisible, setIsVisible] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        let ticking = false;

        const handleScroll = () => {
            if (ticking) return;

            ticking = true;
            window.requestAnimationFrame(() => {
                setIsVisible(window.scrollY > 120);
                ticking = false;
            });
        };

        handleScroll();
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const hideFloatingCart =
        pathname === "/checkout" ||
        pathname?.startsWith("/admin") ||
        pathname?.startsWith("/rider") ||
        pathname?.startsWith("/profile") ||
        pathname?.startsWith("/track") ||
        pathname === "/login" ||
        pathname === "/signup" ||
        pathname === "/forgot-password" ||
        pathname === "/reset-password" ||
        pathname === "/verify-email";

    if (hideFloatingCart) {
        return null;
    }

    return (
        <motion.button
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: isVisible || itemCount > 0 ? 1 : 0, opacity: isVisible || itemCount > 0 ? 1 : 0, y: isVisible || itemCount > 0 ? 0 : 50 }}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onCartClick}
            aria-label="Open Floating Cart"
            style={{ willChange: "transform, opacity", bottom: "calc(6.25rem + env(safe-area-inset-bottom))" }}
            className="fixed right-4 z-40 flex h-15 w-15 items-center justify-center rounded-[1.4rem] border border-white/45 bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] text-white shadow-[0_24px_50px_rgba(217,71,47,0.38)] backdrop-blur-lg md:bottom-8 md:right-10 md:h-16 md:w-16"
        >
            <ShoppingCart className="h-7 w-7" />
            {itemCount > 0 && (
                <motion.span 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-950 px-1 text-xs font-black text-white shadow-xl ring-4 ring-white dark:bg-white dark:text-slate-950 dark:ring-slate-900"
                >
                    {itemCount}
                </motion.span>
            )}
        </motion.button>
    );
}

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
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    if (pathname === "/checkout" || pathname?.startsWith("/admin")) {
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
            style={{ willChange: "transform, opacity" }}
            className="fixed bottom-24 md:bottom-8 right-6 md:right-10 z-50 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_20px_50px_rgba(37,99,235,0.4)] hover:bg-blue-700 transition-all border border-white/20 backdrop-blur-lg"
        >
            <ShoppingCart className="h-7 w-7" />
            {itemCount > 0 && (
                <motion.span 
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-xs font-black text-white shadow-xl ring-4 ring-white dark:ring-slate-900"
                >
                    {itemCount}
                </motion.span>
            )}
        </motion.button>
    );
}

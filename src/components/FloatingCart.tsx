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
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: isVisible || itemCount > 0 ? 1 : 0, opacity: isVisible || itemCount > 0 ? 1 : 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCartClick}
            className="fixed bottom-24 md:bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 dark:shadow-blue-900/50 hover:bg-blue-700 transition-colors"
        >
            <ShoppingCart className="h-6 w-6" />
            {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm ring-2 ring-white dark:ring-gray-900">
                    {itemCount}
                </span>
            )}
        </motion.button>
    );
}

"use client";

import { Plus, Minus } from "lucide-react";
import * as motion from "framer-motion/client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function AddToCartButton({ product }: { product: any }) {
    const { cart, addToCart, updateQuantity } = useCart();
    const { data: session } = useSession();
    const router = useRouter();

    const cartItem = cart.find((item) => item.productId === product._id);

    if (!product.inStock) {
        return (
            <span className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-rose-500 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-rose-300">
                Sold Out
            </span>
        );
    }

    if (cartItem) {
        return (
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-sm dark:border-slate-800/80 dark:bg-slate-950/80">
                <button
                    onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                    className="rounded-xl bg-slate-100 p-2 text-slate-700 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    aria-label={`Decrease ${product.name}`}
                >
                    <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-black text-slate-900 dark:text-white">{cartItem.quantity}</span>
                <button
                    onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                    className="rounded-xl bg-slate-950 p-2 text-white hover:opacity-90 dark:bg-white dark:text-slate-950"
                    aria-label={`Increase ${product.name}`}
                >
                    <Plus className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => {
                if (!session) {
                    toast.error("Please log in before placing an order.");
                    router.push("/login");
                    return;
                }

                addToCart({
                    productId: product._id,
                    name: product.name,
                    price: product.price,
                    quantity: 1,
                    image: product.image,
                });

                toast.success(`${product.name} added to cart`, {
                    description: `${formatCurrency(product.price)} • ${product.unit || "Standard pack"}`,
                });
            }}
            className="app-button app-button-primary rounded-[1.15rem] px-4 py-3 text-[11px]"
        >
            Add
        </motion.button>
    );
}

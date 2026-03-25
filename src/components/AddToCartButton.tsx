"use client";

import { useCart } from "@/context/CartContext";
import { Plus, Minus } from "lucide-react";
import * as motion from "framer-motion/client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AddToCartButton({ product }: { product: any }) {
    const { cart, addToCart, updateQuantity } = useCart();
    const { data: session } = useSession();
    const router = useRouter();

    const cartItem = cart.find((i) => i.productId === product._id);

    if (!product.inStock) {
        return (
            <span className="text-sm font-bold text-red-500 px-4 py-2 bg-red-50 rounded-xl whitespace-nowrap">
                Out of Stock
            </span>
        );
    }

    if (cartItem) {
        return (
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-xl p-1.5 shadow-sm">
                <button
                    onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                    className="p-1.5 bg-white shadow-sm hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                >
                    <Minus className="w-5 h-5" />
                </button>
                <span className="w-6 text-center font-bold text-gray-900">
                    {cartItem.quantity}
                </span>
                <button
                    onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                    className="p-1.5 bg-white shadow-sm hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
        );
    }

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
                if (!session) {
                    toast.error("Please login to order products.");
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
                    description: `₹${product.price} • ${product.unit}`,
                    icon: '🛍️'
                });
            }}
            className="px-5 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-md hover:shadow-lg hover:shadow-red-600/20 active:scale-95 transform whitespace-nowrap"
        >
            Add
        </motion.button>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { Plus, Minus, ShoppingCart, Heart } from "lucide-react";
import Image from "next/image";
import * as motion from "framer-motion/client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProductListing({ categorySlug }: { categorySlug: string }) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);
    const { cart, addToCart, updateQuantity } = useCart();
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/products?categorySlug=${categorySlug}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.success) setProducts(data.data);
                setLoading(false);
            });
    }, [categorySlug]);

    useEffect(() => {
        if (session) {
            fetch('/api/wishlist')
                .then(res => res.json())
                .then(data => {
                    if (data.success) setWishlistItems(data.data);
                });
        }
    }, [session]);

    const toggleWishlist = async (productId: string) => {
        if (!session) {
            toast.error("Please login to add to wishlist.");
            router.push("/login");
            return;
        }

        const isWished = wishlistItems.includes(productId);
        setWishlistItems(prev => isWished ? prev.filter(id => id !== productId) : [...prev, productId]);

        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (!data.success) {
                setWishlistItems(prev => isWished ? [...prev, productId] : prev.filter(id => id !== productId));
                toast.error(data.error || "Failed to update wishlist");
            }
        } catch (e) {
            setWishlistItems(prev => isWished ? [...prev, productId] : prev.filter(id => id !== productId));
            toast.error("Error updating wishlist");
        }
    };

    if (loading)
        return (
            <div className="py-20 text-center text-gray-500 animate-pulse font-medium">
                Loading products...
            </div>
        );

    if (products.length === 0) {
        return (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
                <ShoppingCart className="w-16 h-16 mb-4 text-gray-200 dark:text-gray-700" />
                <p className="font-medium text-lg">No products found here.</p>
                <p className="text-sm mt-1">Check back later for new arrivals.</p>
            </div>
        );
    }

    return (
        <motion.div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
            initial="hidden"
            animate="show"
            variants={{
                hidden: { opacity: 0 },
                show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                }
            }}
        >
            {products.map((product) => {
                const cartItem = cart.find((i) => i.productId === product._id);

                return (
                    <motion.div
                        key={product._id}
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            show: { opacity: 1, y: 0 }
                        }}
                        className="flex flex-col justify-between bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 transition-all duration-300 group"
                    >
                        <div className="relative w-full h-40 sm:h-44 md:h-48 overflow-hidden bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product._id); }}
                                className="absolute top-3 right-3 z-10 p-2 bg-white/80 dark:bg-gray-950/80 backdrop-blur rounded-full hover:bg-white dark:hover:bg-gray-900 transition-colors shadow-sm"
                            >
                                <Heart className={`w-5 h-5 ${wishlistItems.includes(product._id) ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                            </button>
                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <ShoppingCart className="w-12 h-12 text-gray-200" />
                                </div>
                            )}
                        </div>
                        <div className="p-3 sm:p-4 md:p-6 flex flex-col justify-between grow">
                            <div>
                                <div className="flex justify-between items-start gap-4">
                                    <h3 className="font-bold text-base md:text-xl text-gray-900 dark:text-white leading-tight">
                                        {product.name}
                                    </h3>
                                </div>
                                <p className="text-[10px] md:text-sm font-medium text-gray-400 dark:text-gray-500 mt-2 bg-gray-50 dark:bg-gray-700 inline-block px-2 py-1 rounded">
                                    {product.unit}
                                </p>
                            </div>

                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 md:mt-8 pt-4 border-t border-gray-50 dark:border-gray-700">
                                <div className="font-black text-lg md:text-2xl text-gray-900 dark:text-white">
                                    ₹{product.price}
                                </div>

                                {!product.inStock ? (
                                    <span className="text-sm font-bold text-red-500 dark:text-red-400 px-4 py-2 bg-red-50 dark:bg-red-900/30 rounded-xl">
                                        Out of Stock
                                    </span>
                                ) : cartItem ? (
                                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-1.5 shadow-sm">
                                        <button
                                            onClick={() =>
                                                updateQuantity(product._id, cartItem.quantity - 1)
                                            }
                                            className="p-1.5 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </button>
                                        <span className="w-6 text-center font-bold text-gray-900 dark:text-white">
                                            {cartItem.quantity}
                                        </span>
                                        <button
                                            onClick={() =>
                                                updateQuantity(product._id, cartItem.quantity + 1)
                                            }
                                            className="p-1.5 bg-white dark:bg-gray-800 shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
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
                                            });
                                            toast.success(`${product.name} added to cart`, {
                                                description: `₹${product.price} • ${product.unit}`,
                                                icon: '🛍️'
                                            });
                                        }}
                                        className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 transform"
                                    >
                                        Add
                                    </motion.button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}

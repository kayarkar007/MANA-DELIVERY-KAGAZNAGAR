"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { Heart, ShoppingCart, Loader2, Plus, Minus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import * as motion from "framer-motion/client";
import { toast } from "sonner";

export default function WishlistPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { cart, addToCart, updateQuantity } = useCart();
    const [removing, setRemoving] = useState<string | null>(null);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            fetch("/api/wishlist/details")
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setProducts(data.data);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [status, session, router]);

    const removeFromWishlist = async (productId: string) => {
        setRemoving(productId);
        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId })
            });
            const data = await res.json();
            if (data.success) {
                setProducts(products.filter(p => p._id !== productId));
                toast.success("Removed from wishlist");
            } else {
                toast.error(data.error || "Failed to remove");
            }
        } catch (e) {
            toast.error("Error removing from wishlist");
        } finally {
            setRemoving(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-5xl mx-auto">
                <Link href="/profile" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-6 font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to Profile
                </Link>

                <h2 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-red-500 fill-red-500" /> My Wishlist
                </h2>

                {products.length === 0 ? (
                    <div className="bg-white p-16 text-center rounded-[2rem] border border-dashed border-gray-300 shadow-sm transition-all hover:border-gray-400">
                        <Heart className="w-20 h-20 text-gray-200 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">Save your favorite local products here so you can easily find and order them later.</p>
                        <Link href="/" className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg shadow-black/20">
                            Explore Products
                        </Link>
                    </div>
                ) : (
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
                                        hidden: { opacity: 0, scale: 0.95 },
                                        show: { opacity: 1, scale: 1 }
                                    }}
                                    className="flex flex-col justify-between bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:border-red-100 transition-all duration-300 group"
                                >
                                    <div className="relative w-full h-56 overflow-hidden bg-gray-50 border-b border-gray-100">
                                        <button
                                            onClick={() => removeFromWishlist(product._id)}
                                            disabled={removing === product._id}
                                            className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 backdrop-blur-md rounded-full hover:bg-white transition-all shadow-sm hover:scale-110 active:scale-95 text-red-500"
                                            title="Remove from wishlist"
                                        >
                                            {removing === product._id ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : <Heart className="w-5 h-5 fill-red-500" />}
                                        </button>

                                        {product.image ? (
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingCart className="w-12 h-12 text-gray-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 flex flex-col justify-between flex-grow">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-900 leading-tight">
                                                {product.name}
                                            </h3>
                                            <p className="text-sm font-medium text-gray-500 mt-2 bg-gray-50 inline-flex px-3 py-1 rounded-lg border border-gray-100">
                                                Unit: {product.unit}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-50">
                                            <div className="font-black text-2xl text-gray-900">
                                                ₹{product.price}
                                            </div>

                                            {!product.inStock ? (
                                                <span className="text-sm font-bold text-red-500 px-4 py-2 bg-red-50 rounded-xl">
                                                    Out of Stock
                                                </span>
                                            ) : cartItem ? (
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
                                            ) : (
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => {
                                                        addToCart({
                                                            productId: product._id,
                                                            name: product.name,
                                                            price: product.price,
                                                            quantity: 1,
                                                        });
                                                        toast.success(`${product.name} added to cart`, {
                                                            icon: '🛍️'
                                                        });
                                                    }}
                                                    className="px-6 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md hover:shadow-lg active:scale-95 transform"
                                                >
                                                    Add to Cart
                                                </motion.button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

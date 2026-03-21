"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { Plus, Minus, ShoppingCart, Heart, Star } from "lucide-react";
import Image from "next/image";
import * as motion from "framer-motion/client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProductListing({ categorySlug }: { categorySlug: string }) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);
    const [ratings, setRatings] = useState<Record<string, { avgRating: number; count: number }>>({});
    const { cart, addToCart, updateQuantity } = useCart();
    const { data: session } = useSession();
    const router = useRouter();

    useEffect(() => {
        fetch(`/api/products?categorySlug=${categorySlug}`)
            .then((res) => res.json())
            .then(async (data) => {
                if (data.success) {
                    setProducts(data.data);

                    // Fetch ratings for all products in one batch request
                    const ids = data.data.map((p: any) => p._id).filter(Boolean);
                    if (ids.length > 0) {
                        try {
                            const rRes = await fetch("/api/reviews/ratings", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ productIds: ids }),
                            });
                            const rData = await rRes.json();
                            if (rData.success && rData.data.length > 0) {
                                const map: Record<string, { avgRating: number; count: number }> = {};
                                rData.data.forEach((r: any) => {
                                    map[r.productId] = { avgRating: r.avgRating, count: r.count };
                                });
                                setRatings(map);
                            }
                        } catch {
                            // Ratings are non-critical, ignore fetch errors
                        }
                    }
                }
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
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
            {products.map((product, idx) => {
                const cartItem = cart.find((i) => i.productId === product._id);
                const isPremium = idx % 3 === 0;
                const rating = ratings[product._id];

                return (
                    <motion.div
                        key={product._id}
                        variants={{
                            hidden: { opacity: 0, y: 30 },
                            show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
                        }}
                        className="group flex flex-col bg-white/50 dark:bg-slate-900/50 glass-card rounded-[2rem] overflow-hidden premium-shadow hover:-translate-y-2 transition-all duration-500"
                    >
                        <div className="relative w-full aspect-[4/3] overflow-hidden">
                            {isPremium && (
                                <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg animate-pulse-soft">
                                    Best Value
                                </div>
                            )}
                            <button
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product._id); }}
                                className="absolute top-4 right-4 z-10 p-2.5 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl rounded-full hover:scale-110 active:scale-90 transition-all shadow-lg border border-white/20"
                            >
                                <Heart className={`w-5 h-5 ${wishlistItems.includes(product._id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                            </button>
                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                    <ShoppingCart className="w-16 h-16 text-slate-200 dark:text-slate-700" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        <div className="p-6 md:p-8 flex flex-col h-full">
                            <div className="mb-4">
                                <h3 className="font-black text-xl md:text-2xl text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                    {product.name}
                                </h3>

                                {/* ✅ Feature: Product Description */}
                                {product.description && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-2 line-clamp-2">
                                        {product.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                                        {product.unit}
                                    </span>
                                    {product.inStock && (
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> In Stock
                                        </span>
                                    )}
                                    {/* ✅ Feature: Average Rating */}
                                    {rating && rating.count > 0 && (
                                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                                            <Star className="w-3 h-3 fill-amber-500" />
                                            {rating.avgRating} ({rating.count})
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto flex items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Price</span>
                                    <span className="font-black text-2xl md:text-3xl text-slate-900 dark:text-white">
                                        ₹{product.price}
                                    </span>
                                </div>

                                {!product.inStock ? (
                                    <span className="px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest">
                                        Sold Out
                                    </span>
                                ) : cartItem ? (
                                    <div className="flex items-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl p-1.5 shadow-xl shadow-slate-900/20">
                                        <motion.button
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                                            className="p-1.5 hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-xl transition-colors"
                                        >
                                            <Minus className="w-5 h-5" />
                                        </motion.button>
                                        <span className="w-8 text-center font-black text-lg">
                                            {cartItem.quantity}
                                        </span>
                                        <motion.button
                                            whileTap={{ scale: 0.8 }}
                                            onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                                            className="p-1.5 hover:bg-white/10 dark:hover:bg-slate-900/10 rounded-xl transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
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
                                            toast.success(`${product.name} added`, {
                                                style: { borderRadius: '1rem', border: 'none', background: '#0f172a', color: '#fff' }
                                            });
                                        }}
                                        className="px-8 py-3.5 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-500/30 hover:bg-red-700 hover:shadow-red-500/50 transition-all uppercase tracking-widest text-xs"
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
    );
}

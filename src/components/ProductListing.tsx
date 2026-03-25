"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as motion from "framer-motion/client";
import { Heart, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { cn, formatCurrency } from "@/lib/utils";

export default function ProductListing({ categorySlug }: { categorySlug: string }) {
    const { data: session } = useSession();
    const router = useRouter();
    const { cart, addToCart, updateQuantity } = useCart();

    const [products, setProducts] = useState<any[]>([]);
    const [wishlistItems, setWishlistItems] = useState<string[]>([]);
    const [ratings, setRatings] = useState<Record<string, { avgRating: number; count: number }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const bootstrap = async () => {
            setLoading(true);

            try {
                const productRes = await fetch(`/api/products?categorySlug=${categorySlug}`, { signal: controller.signal });
                const productData = await productRes.json();

                if (!productData.success || controller.signal.aborted) {
                    setProducts([]);
                    return;
                }

                const fetchedProducts = productData.data || [];
                setProducts(fetchedProducts);

                const ratingPromise = fetchedProducts.length
                    ? fetch("/api/reviews/ratings", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ productIds: fetchedProducts.map((product: any) => product._id) }),
                        signal: controller.signal,
                    }).then((response) => response.json()).catch(() => ({ success: false, data: [] }))
                    : Promise.resolve({ success: false, data: [] });

                const wishlistPromise = session
                    ? fetch("/api/wishlist", { signal: controller.signal }).then((response) => response.json()).catch(() => ({ success: false, data: [] }))
                    : Promise.resolve({ success: false, data: [] });

                const [ratingData, wishlistData] = await Promise.all([ratingPromise, wishlistPromise]);

                if (!controller.signal.aborted && ratingData.success) {
                    const nextRatings: Record<string, { avgRating: number; count: number }> = {};
                    for (const item of ratingData.data || []) {
                        nextRatings[item.productId] = { avgRating: item.avgRating, count: item.count };
                    }
                    setRatings(nextRatings);
                }

                if (!controller.signal.aborted && wishlistData.success) {
                    setWishlistItems(wishlistData.data || []);
                }
            } catch {
                if (!controller.signal.aborted) {
                    setProducts([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        bootstrap();
        return () => controller.abort();
    }, [categorySlug, session?.user?.id]);

    const toggleWishlist = async (productId: string) => {
        if (!session) {
            toast.error("Please log in to save favorites.");
            router.push("/login");
            return;
        }

        const wished = wishlistItems.includes(productId);
        setWishlistItems((prev) => wished ? prev.filter((id) => id !== productId) : [...prev, productId]);

        try {
            const res = await fetch("/api/wishlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId }),
            });
            const data = await res.json();

            if (!data.success) {
                setWishlistItems((prev) => wished ? [...prev, productId] : prev.filter((id) => id !== productId));
                toast.error(data.error || "Unable to update wishlist");
            }
        } catch {
            setWishlistItems((prev) => wished ? [...prev, productId] : prev.filter((id) => id !== productId));
            toast.error("Unable to update wishlist");
        }
    };

    if (loading) {
        return (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-[23rem] animate-pulse rounded-[2rem] border border-slate-200/80 bg-white/75 dark:border-slate-800/80 dark:bg-slate-900/70" />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="app-card rounded-[2.5rem] border-dashed p-14 text-center">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <ShoppingBag className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">No products in this section yet.</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                    This collection is being prepared. Check back in a little while.
                </p>
            </div>
        );
    }

    return (
        <motion.div
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
        >
            {products.map((product, index) => {
                const cartItem = cart.find((item) => item.productId === product._id);
                const rating = ratings[product._id];
                const isWished = wishlistItems.includes(product._id);
                const lowStock = typeof product.stockQuantity === "number" && product.stockQuantity > 0 && product.stockQuantity <= 5;

                return (
                    <motion.article
                        key={product._id}
                        variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
                        className="group overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/72"
                    >
                        <div className="relative aspect-[4/3] overflow-hidden">
                            <div className="absolute left-4 top-4 z-10 flex gap-2">
                                {index % 3 === 0 && <span className="app-badge">Popular pick</span>}
                                {lowStock && <span className="app-badge !bg-amber-500/10 !text-amber-600 dark:!text-amber-300">Low stock</span>}
                            </div>

                            <button
                                onClick={() => toggleWishlist(product._id)}
                                className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/45 bg-white/86 shadow-lg backdrop-blur-xl dark:border-white/8 dark:bg-slate-950/86"
                                aria-label={isWished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                            >
                                <Heart className={cn("h-5 w-5", isWished ? "fill-red-500 text-red-500" : "text-slate-400")} />
                            </button>

                            {product.image ? (
                                <Image
                                    src={product.image}
                                    alt={product.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-900">
                                    <ShoppingBag className="h-16 w-16 text-slate-300 dark:text-slate-700" />
                                </div>
                            )}

                            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/55 to-transparent" />
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                                        {product.unit || "Standard pack"}
                                    </span>
                                    {product.inStock && (
                                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">
                                            In stock
                                        </span>
                                    )}
                                    {rating?.count ? (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300">
                                            <Star className="h-3.5 w-3.5 fill-current" />
                                            {rating.avgRating} ({rating.count})
                                        </span>
                                    ) : null}
                                </div>

                                <div>
                                    <h3 className="text-2xl font-black leading-tight text-slate-900 dark:text-white">{product.name}</h3>
                                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        {product.description || "Fresh local essentials delivered quickly and safely."}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-end justify-between gap-4 border-t border-slate-200/80 pt-5 dark:border-slate-800/90">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Price</p>
                                    <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
                                        {formatCurrency(product.price)}
                                    </p>
                                </div>

                                {!product.inStock ? (
                                    <span className="rounded-2xl bg-slate-100 px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                                        Sold out
                                    </span>
                                ) : cartItem ? (
                                    <div className="flex items-center gap-3 rounded-2xl bg-slate-950 p-1.5 text-white shadow-xl shadow-slate-950/20 dark:bg-white dark:text-slate-950">
                                        <button
                                            onClick={() => updateQuantity(product._id, cartItem.quantity - 1)}
                                            className="rounded-xl p-2 hover:bg-white/10 dark:hover:bg-slate-950/10"
                                            aria-label={`Decrease ${product.name}`}
                                        >
                                            <Minus className="h-4 w-4" />
                                        </button>
                                        <span className="w-6 text-center text-base font-black">{cartItem.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(product._id, cartItem.quantity + 1)}
                                            className="rounded-xl p-2 hover:bg-white/10 dark:hover:bg-slate-950/10"
                                            aria-label={`Increase ${product.name}`}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button
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
                                            toast.success(`${product.name} added to cart`);
                                        }}
                                        className="app-button app-button-primary rounded-[1.15rem]"
                                    >
                                        Add to cart
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.article>
                );
            })}
        </motion.div>
    );
}

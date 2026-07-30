"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatCurrency, cn } from "@/lib/utils";
import { Plus, Minus, ShoppingBag, Heart, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ProductDetailActionsProps {
  product: {
    _id: string;
    name: string;
    price: number;
    unit: string;
    image?: string;
    inStock: boolean;
    stockQuantity?: number;
    shop?: {
      shopId: string;
      name: string;
    };
  };
}

export default function ProductDetailActions({ product }: ProductDetailActionsProps) {
  const { cart, addToCart, updateQuantity } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const [isWished, setIsWished] = useState(false);

  const cartItem = cart.find((item) => item.productId === product._id);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = () => {
    if (!product.inStock) {
      toast.error("Product is currently out of stock");
      return;
    }
    addToCart({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
      shop: product.shop,
    });
    toast.success(`Added ${product.name} to cart`);
  };

  const toggleWishlist = async () => {
    if (!session) {
      toast.error("Please log in to save favorites");
      router.push("/login");
      return;
    }

    const nextWished = !isWished;
    setIsWished(nextWished);

    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product._id }),
      });
      const data = await res.json();
      if (!data.success) {
        setIsWished(!nextWished);
        toast.error(data.error || "Failed to update wishlist");
      } else {
        toast.success(nextWished ? "Added to wishlist" : "Removed from wishlist");
      }
    } catch {
      setIsWished(!nextWished);
      toast.error("Failed to update wishlist");
    }
  };

  return (
    <div className="space-y-6">
      {/* Price & Unit */}
      <div className="flex items-baseline justify-between border-b border-slate-200/80 pb-6 dark:border-slate-800/80">
        <div>
          <span className="text-3xl font-black text-slate-900 dark:text-white sm:text-4xl">
            {formatCurrency(product.price)}
          </span>
          <span className="ml-2 text-xs font-bold text-slate-400">/ {product.unit}</span>
        </div>
        <div>
          {product.inStock ? (
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              In Stock
            </span>
          ) : (
            <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Cart Controls */}
      <div className="flex items-center gap-4">
        {currentQuantity > 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => updateQuantity(product._id, currentQuantity - 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 shadow-sm transition hover:bg-slate-100 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-black text-slate-900 dark:text-white">
              {currentQuantity}
            </span>
            <button
              onClick={() => updateQuantity(product._id, currentQuantity + 1)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-sm transition hover:bg-red-700"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!product.inStock}
            className="flex-1 app-button app-button-primary rounded-2xl py-4 text-base font-black shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            <ShoppingBag className="h-5 w-5 mr-2" />
            Add to Cart
          </button>
        )}

        <button
          onClick={toggleWishlist}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
          aria-label={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("h-6 w-6", isWished ? "fill-red-500 text-red-500" : "text-slate-400")} />
        </button>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-slate-900/50">
        <div className="flex flex-col items-center text-center">
          <Truck className="h-5 w-5 text-red-600 mb-1" />
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">Fast Delivery</span>
          <span className="text-[9px] text-slate-400">Same Day</span>
        </div>
        <div className="flex flex-col items-center text-center border-x border-slate-200/80 dark:border-slate-800/80">
          <ShieldCheck className="h-5 w-5 text-emerald-600 mb-1" />
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">Fresh Quality</span>
          <span className="text-[9px] text-slate-400">Guaranteed</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <RefreshCw className="h-5 w-5 text-sky-600 mb-1" />
          <span className="text-[10px] font-black text-slate-700 dark:text-slate-300">Easy Returns</span>
          <span className="text-[9px] text-slate-400">Instant Refund</span>
        </div>
      </div>
    </div>
  );
}

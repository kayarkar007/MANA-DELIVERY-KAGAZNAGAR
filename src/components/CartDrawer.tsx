"use client";

import { useCart } from "@/context/CartContext";
import { calculatePricing } from "@/lib/utils";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";

export default function CartDrawer({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { cart, updateQuantity, cartTotal } = useCart();
    const pricing = calculatePricing(cartTotal);
    const { data: session } = useSession();

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-full sm:max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl shadow-[0_0_50px_rgba(0,0,0,0.1)] flex flex-col border-l border-white/20"
                    >
                        <div className="flex items-center justify-between p-6 md:p-8 border-b border-white/10">
                            <h2 className="text-xl md:text-2xl font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tight">
                                <ShoppingBag className="w-6 h-6 text-red-600 dark:text-red-400" /> Your Cart
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-all active:scale-95"
                            >
                                <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                    <motion.div 
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="bg-slate-100 dark:bg-slate-800 p-10 rounded-full mb-6 border border-white/10 shadow-inner"
                                    >
                                        <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                                    </motion.div>
                                    <p className="font-black text-xl text-slate-900 dark:text-white">Your cart is empty.</p>
                                    <p className="text-sm mt-2 opacity-80">Add some products to see them here.</p>
                                </div>
                            ) : (
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={{
                                        hidden: {},
                                        show: { transition: { staggerChildren: 0.05 } }
                                    }}
                                    className="space-y-6"
                                >
                                    {cart.map((item) => (
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, x: 20 },
                                                show: { opacity: 1, x: 0 }
                                            }}
                                            key={item.productId}
                                            className="group flex flex-col gap-4 p-5 bg-white/40 dark:bg-slate-800/40 border border-white/10 rounded-[1.5rem] shadow-sm hover:shadow-xl transition-all duration-300"
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-black text-slate-900 dark:text-white text-lg leading-tight group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                                                    {item.name}
                                                </span>
                                                <span className="font-black text-slate-900 dark:text-white text-lg shrink-0">
                                                    ₹{(item.price * item.quantity).toFixed(0)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest px-2 py-0.5 bg-slate-100 dark:bg-slate-900/50 rounded">
                                                    ₹{item.price} / unit
                                                </span>
                                                <div className="flex items-center gap-4 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl p-1.5 shadow-xl shadow-slate-950/20">
                                                    <motion.button
                                                        whileTap={{ scale: 0.8 }}
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="p-1 hover:bg-white/10 dark:hover:bg-slate-950/10 rounded-lg transition-colors"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </motion.button>
                                                    <span className="w-5 text-center font-black text-md">
                                                        {item.quantity}
                                                    </span>
                                                    <motion.button
                                                        whileTap={{ scale: 0.8 }}
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        className="p-1 hover:bg-white/10 dark:hover:bg-slate-950/10 rounded-lg transition-colors"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-6 md:p-8 bg-white/40 dark:bg-slate-900/40 border-t border-white/10 backdrop-blur-md rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                                <div className="space-y-4 text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900 dark:text-slate-300">₹{pricing.subtotal.toFixed(0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Extras (Tax/Delivery)</span>
                                        <span className="text-slate-900 dark:text-slate-300">₹{(pricing.deliveryFee + pricing.platformFee + pricing.tax).toFixed(0)}</span>
                                    </div>
                                    <div className="pt-4 border-t border-white/5 flex justify-between font-black text-2xl text-slate-900 dark:text-white normal-case tracking-tight">
                                        <span>Total Amount</span>
                                        <span className="text-gradient">₹{pricing.total.toFixed(0)}</span>
                                    </div>
                                </div>
                                <Link
                                    href={session ? "/checkout" : "/login"}
                                    onClick={(e) => {
                                        onClose();
                                    }}
                                    className="w-full h-16 flex justify-center items-center bg-red-600 text-white font-black rounded-2xl shadow-2xl shadow-red-500/40 hover:bg-red-700 hover:scale-[1.02] transform transition-all active:scale-95 uppercase tracking-widest text-sm"
                                >
                                    Complete Checkout
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

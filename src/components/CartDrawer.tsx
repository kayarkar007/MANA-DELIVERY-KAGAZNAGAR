"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { calculatePricing, formatCurrency } from "@/lib/utils";

export default function CartDrawer({
    isOpen,
    onClose,
}: {
    isOpen: boolean;
    onClose: () => void;
}) {
    const { cart, updateQuantity, cartTotal } = useCart();
    const { data: session } = useSession();
    const pricing = calculatePricing(cartTotal);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Drawer */}
                    <motion.aside
                        role="dialog"
                        aria-modal="true"
                        aria-label="Shopping Cart"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-full flex-col border-l border-white/45 bg-[rgba(255,252,247,0.94)] shadow-[0_0_65px_rgba(15,23,42,0.12)] backdrop-blur-3xl dark:border-white/8 dark:bg-[rgba(9,16,29,0.94)] sm:max-w-md"
                        style={{ paddingTop: "env(safe-area-inset-top)" }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-4 dark:border-slate-800/90 sm:px-6 sm:py-5">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current basket</p>
                                <h2 className="font-display mt-1.5 flex items-center gap-2.5 text-xl font-black text-slate-900 dark:text-white sm:text-2xl">
                                    <ShoppingBag className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    Your Cart
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="app-icon-button h-11 w-11 rounded-2xl"
                                aria-label="Close cart"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                            {cart.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
                                    <div className="mb-5 rounded-full border border-white/40 bg-white/75 p-8 shadow-inner dark:border-white/8 dark:bg-slate-900/80">
                                        <ShoppingBag className="h-14 w-14 text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-lg font-black text-slate-900 dark:text-white">Your cart is empty.</p>
                                    <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                                        Add a few items and checkout will be ready instantly.
                                    </p>
                                    <button
                                        onClick={onClose}
                                        className="app-button app-button-primary mt-6 rounded-2xl"
                                    >
                                        Browse products
                                    </button>
                                </div>
                            ) : (
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
                                    className="space-y-3 sm:space-y-4"
                                >
                                    {cart.map((item) => (
                                        <motion.div
                                            key={item.productId}
                                            variants={{
                                                hidden: { opacity: 0, x: 16 },
                                                show: { opacity: 1, x: 0 },
                                            }}
                                            className="rounded-[1.4rem] border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/72"
                                        >
                                            {/* Name + total price row */}
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    {/* overflow-wrap prevents long names from causing horizontal scroll */}
                                                    <p className="break-words text-base font-black leading-tight text-slate-900 dark:text-white">
                                                        {item.name}
                                                    </p>
                                                    <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                                        {formatCurrency(item.price)} per unit
                                                    </p>
                                                </div>
                                                <p className="shrink-0 text-base font-black text-slate-900 dark:text-white">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </p>
                                            </div>

                                            {/* Quantity stepper */}
                                            <div className="mt-3 flex items-center justify-end">
                                                <div className="flex items-center gap-3 rounded-xl bg-slate-950 p-1.5 text-white shadow-lg shadow-slate-950/20 dark:bg-white dark:text-slate-950">
                                                    <motion.button
                                                        whileTap={{ scale: 0.84 }}
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 dark:hover:bg-slate-950/10"
                                                        aria-label={`Decrease ${item.name} quantity`}
                                                    >
                                                        <Minus className="h-4 w-4" />
                                                    </motion.button>
                                                    <span className="w-6 text-center text-sm font-black" aria-live="polite">
                                                        {item.quantity}
                                                    </span>
                                                    <motion.button
                                                        whileTap={{ scale: 0.84 }}
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-white/10 dark:hover:bg-slate-950/10"
                                                        aria-label={`Increase ${item.name} quantity`}
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </motion.button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {/* Summary + CTA */}
                        {cart.length > 0 && (
                            <div
                                className="rounded-t-[2rem] border-t border-slate-200/80 bg-white/75 px-4 pt-5 pb-4 shadow-[0_-20px_50px_rgba(15,23,42,0.05)] backdrop-blur-md dark:border-slate-800/90 dark:bg-slate-950/72 sm:px-6 sm:pt-6"
                                style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
                            >
                                <div className="mb-5 space-y-2.5 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                                    <div className="flex items-center justify-between">
                                        <span>Subtotal</span>
                                        <span className="text-slate-900 dark:text-slate-200">{formatCurrency(pricing.subtotal)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span>Taxes and fees</span>
                                        <span className="text-slate-900 dark:text-slate-200">
                                            {formatCurrency(pricing.deliveryFee + pricing.platformFee + pricing.tax)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-lg normal-case tracking-tight text-slate-900 dark:border-slate-800/90 dark:text-white">
                                        <span>Total</span>
                                        <span className="text-gradient">{formatCurrency(pricing.total)}</span>
                                    </div>
                                </div>

                                <Link
                                    href={session ? "/checkout" : "/login"}
                                    onClick={onClose}
                                    className="app-button app-button-primary flex h-14 w-full justify-center rounded-2xl text-sm"
                                >
                                    Complete Checkout
                                </Link>
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}

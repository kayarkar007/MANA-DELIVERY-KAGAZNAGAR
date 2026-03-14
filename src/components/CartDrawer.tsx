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
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 right-0 z-50 w-full max-w-full sm:max-w-sm bg-white dark:bg-gray-900 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col"
                    >
                        <div className="flex items-center justify-between p-3 sm:p-4 md:p-5 border-b dark:border-gray-800">
                            <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-2 dark:text-white">
                                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400 shrink-0" /> Your Cart
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors dark:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4">
                            {cart.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                    <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                                        <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                                    </div>
                                    <p className="font-medium">Your cart is empty.</p>
                                    <p className="text-sm mt-1">Add some products to see them here.</p>
                                </div>
                            ) : (
                                <motion.div
                                    initial="hidden"
                                    animate="show"
                                    variants={{
                                        hidden: {},
                                        show: { transition: { staggerChildren: 0.1 } }
                                    }}
                                    className="space-y-4"
                                >
                                    {cart.map((item) => (
                                        <motion.div
                                            variants={{
                                                hidden: { opacity: 0, x: 20 },
                                                show: { opacity: 1, x: 0 }
                                            }}
                                            key={item.productId}
                                            className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm rounded-2xl"
                                        >
                                            <div className="flex justify-between font-semibold">
                                                <span className="text-gray-800 dark:text-gray-100">{item.name}</span>
                                                <span className="dark:text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                                                <span>₹{item.price} each</span>
                                                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-1">
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                                                        className="p-1 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded transition-all"
                                                    >
                                                        <Minus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                    </button>
                                                    <span className="w-5 text-center font-bold text-gray-800 dark:text-gray-100">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                                                        className="p-1 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm rounded transition-all"
                                                    >
                                                        <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="p-3 sm:p-4 md:p-5 bg-white dark:bg-gray-900 border-t dark:border-gray-800 rounded-t-2xl sm:rounded-t-3xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.5)]">
                                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span className="text-gray-800 dark:text-gray-300">₹{pricing.subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Delivery Fee</span>
                                        <span className="text-gray-800 dark:text-gray-300">₹{pricing.deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Platform Fee</span>
                                        <span className="text-gray-800 dark:text-gray-300">₹{pricing.platformFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax (5%)</span>
                                        <span className="text-gray-800 dark:text-gray-300">₹{pricing.tax.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between font-black text-xl pt-3 border-t dark:border-gray-800 text-gray-900 dark:text-white mb-6">
                                    <span>Total</span>
                                    <span>₹{pricing.total.toFixed(2)}</span>
                                </div>
                                <Link
                                    href={session ? "/checkout" : "/login"}
                                    onClick={(e) => {
                                        onClose();
                                    }}
                                    className="w-full flex justify-center items-center bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-transform hover:scale-[1.02] shadow-lg shadow-blue-600/30 dark:shadow-blue-900/50"
                                >
                                    Proceed to Checkout
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

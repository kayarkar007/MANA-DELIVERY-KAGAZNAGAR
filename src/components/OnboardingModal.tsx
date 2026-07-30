"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Truck, Wallet, Sparkles, ArrowRight, X } from "lucide-react";

const slides = [
    {
        icon: Sparkles,
        title: "Welcome to Mana Delivery",
        description: "Kagaznagar ki apni hyperlocal delivery service. Groceries, food, medicines — sab kuch aapke doorstep pe.",
        accent: "from-red-500 to-orange-500",
        bg: "rgba(198,40,40,0.08)",
    },
    {
        icon: ShoppingBag,
        title: "Browse & Add to Cart",
        description: "Categories browse karo, products search karo, aur ek tap mein cart mein add karo. Wishlist bhi save kar sakte ho.",
        accent: "from-amber-500 to-yellow-500",
        bg: "rgba(214,160,70,0.08)",
    },
    {
        icon: Truck,
        title: "Fast Checkout & Live Tracking",
        description: "UPI, Cash on Delivery, ya Wallet se pay karo. Real-time map pe apna order track karo.",
        accent: "from-emerald-500 to-teal-500",
        bg: "rgba(34,197,94,0.08)",
    },
    {
        icon: Wallet,
        title: "Wallet & Rewards",
        description: "Mana Wallet mein balance add karo for faster checkout. Promo codes apply karo aur save karo har order pe.",
        accent: "from-violet-500 to-purple-500",
        bg: "rgba(139,92,246,0.08)",
    },
];

export default function OnboardingModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const hasSeenOnboarding = localStorage.getItem("mana_onboarding_seen");
        if (!hasSeenOnboarding) {
            // Small delay so page loads first
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem("mana_onboarding_seen", "true");
    };

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide((prev) => prev + 1);
        } else {
            handleClose();
        }
    };

    const slide = slides[currentSlide];
    const Icon = slide.icon;
    const isLastSlide = currentSlide === slides.length - 1;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 20 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="fixed inset-x-4 top-[50%] z-[101] mx-auto max-w-md -translate-y-1/2 overflow-hidden rounded-[2.5rem] border border-white/50 bg-white shadow-[0_40px_100px_rgba(0,0,0,0.2)] dark:border-white/10 dark:bg-slate-950"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100/80 text-slate-400 transition-colors hover:text-slate-600 dark:bg-slate-900/80 dark:hover:text-white"
                            aria-label="Close onboarding"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {/* Slide content */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                                className="p-8 pt-14 text-center sm:p-10 sm:pt-16"
                            >
                                {/* Icon */}
                                <div
                                    className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] shadow-lg"
                                    style={{ background: slide.bg }}
                                >
                                    <div className={`flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br ${slide.accent} shadow-xl`}>
                                        <Icon className="h-8 w-8 text-white" />
                                    </div>
                                </div>

                                {/* Text */}
                                <h2 className="font-display text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                                    {slide.title}
                                </h2>
                                <p className="mx-auto mt-4 max-w-xs text-sm leading-7 text-slate-500 dark:text-slate-400">
                                    {slide.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Bottom controls */}
                        <div className="flex items-center justify-between border-t border-slate-100 px-8 py-5 dark:border-slate-800 sm:px-10 sm:py-6">
                            {/* Progress dots */}
                            <div className="flex items-center gap-2">
                                {slides.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            index === currentSlide
                                                ? "w-6 bg-[color:var(--primary)]"
                                                : "w-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                                        }`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                {!isLastSlide && (
                                    <button
                                        onClick={handleClose}
                                        className="text-xs font-black uppercase tracking-[0.16em] text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-white"
                                    >
                                        Skip
                                    </button>
                                )}
                                <button
                                    onClick={handleNext}
                                    className="inline-flex items-center gap-2 rounded-[1.1rem] bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-lg shadow-red-500/30 transition-transform hover:-translate-y-0.5"
                                >
                                    {isLastSlide ? "Get Started" : "Next"}
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

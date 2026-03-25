import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    }).format(value);
}

export function calculatePricing(subtotal: number) {
    const deliveryFee = 30;
    const platformFee = 5;
    const tax = subtotal * 0.05;
    const total = subtotal + deliveryFee + platformFee + tax;
    return {
        subtotal,
        deliveryFee,
        platformFee,
        tax,
        total,
    };
}

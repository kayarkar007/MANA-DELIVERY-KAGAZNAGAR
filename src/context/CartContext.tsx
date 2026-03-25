"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

interface CartContextProps {
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem("hypercart");
        if (stored) {
            try {
                setCart(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse cart data from local storage", e);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("hypercart", JSON.stringify(cart));
    }, [cart]);

    const addToCart = (item: CartItem) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.productId === item.productId);
            if (existing) {
                return prev.map((i) =>
                    i.productId === item.productId
                        ? { ...i, quantity: i.quantity + item.quantity }
                        : i
                );
            }
            return [...prev, item];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((i) => i.productId !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        setCart((prev) =>
            prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
        );
    };

    const clearCart = () => setCart([]);

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

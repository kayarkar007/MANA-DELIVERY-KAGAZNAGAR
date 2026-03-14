"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { calculatePricing } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MapPin, Phone, User, CheckCircle2, Loader2, ArrowLeft, LocateFixed, CreditCard, Banknote, Tag, Wallet } from "lucide-react";
import Link from "next/link";
import Script from "next/script";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, cartTotal, clearCart } = useCart();
    const { data: session } = useSession();
    const pricing = calculatePricing(cartTotal);

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [locating, setLocating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi" | "wallet">("cod");
    const [transactionId, setTransactionId] = useState("");

    const [promoCode, setPromoCode] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
    const [applyingPromo, setApplyingPromo] = useState(false);

    const [form, setForm] = useState({
        name: "",
        whatsapp: "",
        address: "",
        lat: 17.3850, // Default mock Hyderabad
        lng: 78.4867
    });

    const [walletBalance, setWalletBalance] = useState(0);
    const [useWallet, setUseWallet] = useState(false);

    useEffect(() => {
        if (!session) {
            router.push("/login");
            return;
        }

        // Fetch user profile to auto-fill details
        fetch("/api/user/profile")
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data) {
                    setForm(prev => ({
                        ...prev,
                        name: data.data.name || session.user.name || "",
                        whatsapp: data.data.whatsapp || "",
                        address: data.data.address || "",
                    }));
                    if (data.data.walletBalance) {
                        setWalletBalance(data.data.walletBalance);
                    }
                }
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });

    }, [session, router]);

    const handleLocate = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();

                    if (data && data.display_name) {
                        setForm(prev => ({
                            ...prev,
                            address: data.display_name,
                            lat: latitude,
                            lng: longitude
                        }));
                        toast.success("Location found!", { icon: "📍" });
                    } else {
                        toast.error("Could not fetch address details.");
                    }
                } catch (err) {
                    toast.error("Failed to connect to location services.");
                } finally {
                    setLocating(false);
                }
            },
            (error) => {
                toast.error("Please allow location access in your browser.");
                setLocating(false);
            }
        );
    };

    // ✅ Bug Fix: Check loading first to avoid cart-empty flash during profile fetch
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!cart.length) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Cart is Empty</h2>
                    <p className="text-gray-500 mb-6">Looks like you haven't added any items to your cart yet.</p>
                    <Link href="/" className="inline-block bg-blue-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-700 transition-colors">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    const prevFinalTotal = Math.max(0, pricing.total - (appliedPromo?.discountAmount || 0));
    const walletUsed = useWallet ? Math.min(walletBalance, prevFinalTotal) : 0;
    const finalTotal = Math.max(0, prevFinalTotal - walletUsed);

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;
        setApplyingPromo(true);

        try {
            const res = await fetch("/api/promo/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoCode, cartTotal: pricing.subtotal })
            });
            const data = await res.json();

            if (data.success) {
                setAppliedPromo(data.data);
                toast.success(data.data.message);
            } else {
                setAppliedPromo(null);
                toast.error(data.error);
            }
        } catch (error) {
            toast.error("Failed to validate promo code");
        } finally {
            setApplyingPromo(false);
        }
    };

    const submitOrder = async (method: string, txId?: string) => {
        const orderData = {
            type: "product",
            userId: session?.user?.id,
            customerName: form.name,
            customerPhone: form.whatsapp,
            address: form.address,
            latitude: form.lat,
            longitude: form.lng,
            items: cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: pricing.subtotal,
            deliveryFee: pricing.deliveryFee,
            platformFee: pricing.platformFee,
            tax: pricing.tax,
            discountAmount: appliedPromo?.discountAmount || 0,
            promoCode: appliedPromo?.code,
            walletUsed: walletUsed,
            total: finalTotal,
            paymentMethod: finalTotal === 0 ? "wallet" : method,
            transactionId: txId
        };

        try {
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData)
            });

            const data = await res.json();

            if (data.success) {
                clearCart();

                // Order API returns redirectUrl directly
                if (data.redirectUrl) {
                    window.open(data.redirectUrl, "_blank");
                }

                toast.success("Order Placed Successfully!", {
                    description: "Redirecting to your profile...",
                    icon: '🎉'
                });

                // Ensure UI updates before redirect
                setTimeout(() => {
                    router.push("/profile");
                }, 1000);
            } else {
                toast.error(data.error || "Failed to place order.");
            }
        } catch (error) {
            toast.error("An error occurred while placing your order.");
        } finally {
            setPlacingOrder(false);
        }
    };

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setPlacingOrder(true);

        if (paymentMethod === "upi" && !transactionId.trim()) {
            toast.error("Please enter the UPI Transaction ID.");
            setPlacingOrder(false);
            return;
        }

        // COD or UPI or Wallet
        await submitOrder(paymentMethod, paymentMethod === "upi" ? transactionId : undefined);
    };

    // (loading check moved above cart-empty check)

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 py-10 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 md:px-8 font-sans transition-colors duration-300">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div className="max-w-6xl mx-auto space-y-12">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all mb-4 font-black uppercase tracking-widest text-xs">
                    <ArrowLeft className="w-4 h-4" /> Return to store
                </Link>

                <div className="space-y-2">
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        Secure <br />
                        <span className="text-gradient">Checkout.</span>
                    </h1>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pt-2">
                        Complete your order in <span className="text-blue-600">60 seconds</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Delivery Form */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="glass-card p-8 md:p-12 border-white/20 premium-shadow rounded-[3rem] space-y-10">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <MapPin className="w-6 h-6 text-blue-600" /> Delivery Details
                            </h2>

                            <form onSubmit={handlePlaceOrder} className="space-y-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                            <User className="w-3 h-3" /> Receiver Name
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white p-6 rounded-2xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all font-black text-lg shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                                            <Phone className="w-3 h-3" /> WhatsApp
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={form.whatsapp}
                                            onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white p-6 rounded-2xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all font-black text-lg shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <MapPin className="w-3 h-3" /> Shipping Address
                                        </label>
                                        <button
                                            type="button"
                                            onClick={handleLocate}
                                            disabled={locating}
                                            className="text-[10px] font-black text-blue-600 dark:text-blue-400 flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-4 py-2 rounded-full transition-all border border-blue-100 dark:border-blue-900/30 active:scale-95 disabled:opacity-50"
                                        >
                                            {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <LocateFixed className="w-3 h-3" />}
                                            {locating ? "PINNING..." : "AUTO DETECT"}
                                        </button>
                                    </div>
                                    <textarea
                                        required
                                        rows={3}
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                        placeholder="Flat, Building, Street..."
                                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white p-6 rounded-3xl focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 outline-none transition-all font-bold text-md shadow-inner resize-none"
                                    />
                                </div>

                                {/* Payment Method Section */}
                                <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                        <CreditCard className="w-6 h-6 text-blue-600" /> Payment
                                    </h3>

                                    {walletBalance > 0 && (
                                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-blue-500/30 text-white group cursor-pointer" onClick={() => setUseWallet(!useWallet)}>
                                            <div className="flex items-center gap-6">
                                                <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md group-hover:scale-110 transition-transform">
                                                    <Wallet className="w-8 h-8" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-xl">Apply Wallet</p>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Balance: ₹{walletBalance.toFixed(0)}</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" className="sr-only peer" checked={useWallet} onChange={() => setUseWallet(!useWallet)} />
                                                <div className="w-16 h-8 bg-black/20 backdrop-blur-sm rounded-full peer peer-checked:after:translate-x-8 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-white/40 ring-2 ring-white/10"></div>
                                            </label>
                                        </div>
                                    )}

                                    {finalTotal > 0 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod("cod")}
                                                className={`group flex items-center gap-6 p-8 rounded-[2rem] border-2 transition-all duration-300 ${paymentMethod === "cod" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-white shadow-xl shadow-blue-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-200"}`}
                                            >
                                                <div className={`p-4 rounded-2xl transition-all ${paymentMethod === "cod" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200"}`}>
                                                    <Banknote className="w-8 h-8" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-black text-lg block">Cash</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Pay on Arrival</span>
                                                </div>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod("upi")}
                                                className={`group flex items-center gap-6 p-8 rounded-[2rem] border-2 transition-all duration-300 ${paymentMethod === "upi" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-white shadow-xl shadow-blue-500/10" : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:border-slate-200"}`}
                                            >
                                                <div className={`p-4 rounded-2xl transition-all ${paymentMethod === "upi" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:bg-slate-200"}`}>
                                                    <CreditCard className="w-8 h-8" />
                                                </div>
                                                <div className="text-left">
                                                    <span className="font-black text-lg block">UPI Transfer</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Instant & Manual</span>
                                                </div>
                                            </button>
                                        </div>
                                    )}

                                    {paymentMethod === "upi" && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-slate-900 text-white p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-8"
                                        >
                                            <p className="text-sm text-slate-400 text-center font-bold tracking-tight px-10">Scan to pay <strong className="text-white text-2xl font-black block mt-2">₹{finalTotal.toFixed(0)}</strong></p>

                                            <div className="flex justify-center">
                                                <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl ring-8 ring-white/5 border-4 border-white">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${process.env.NEXT_PUBLIC_UPI_ID || '7659989336@jupiteraxis'}&pn=LocaluDelivery&am=${finalTotal.toFixed(2)}&cu=INR`}
                                                        alt="UPI QR Code"
                                                        className="w-48 h-48 object-contain"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 block">
                                                    Transaction ID (UTR)
                                                </label>
                                                <input
                                                    type="text"
                                                    required={paymentMethod === "upi"}
                                                    value={transactionId}
                                                    onChange={e => setTransactionId(e.target.value)}
                                                    placeholder="12 digit UTR number"
                                                    className="w-full bg-slate-800 border border-white/10 text-white p-6 rounded-2xl focus:ring-4 focus:ring-blue-600/40 focus:border-blue-600 outline-none transition-all font-black text-center text-xl uppercase tracking-widest placeholder:opacity-20 shadow-inner"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={placingOrder}
                                    className="w-full h-20 bg-blue-600 text-white font-black rounded-3xl flex items-center justify-center gap-4 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-70 shadow-[0_25px_60px_-15px_rgba(37,99,235,0.4)] uppercase tracking-[0.2em] text-lg"
                                >
                                    {placingOrder ? <Loader2 className="w-6 h-6 animate-spin" /> : <>Finalize Order <ArrowLeft className="w-5 h-5 rotate-180" /></>}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-8 h-fit lg:sticky lg:top-24">
                        <div className="glass-card p-10 border-white/20 premium-shadow rounded-[3rem] space-y-10">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                <Tag className="w-5 h-5 text-blue-600" /> Summary
                            </h2>

                            <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                                {cart.map((item) => (
                                    <div key={item.productId} className="flex justify-between items-center group">
                                        <div className="flex-1 space-y-1">
                                            <div className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{item.name}</div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty: {item.quantity} × ₹{item.price}</div>
                                        </div>
                                        <div className="font-black text-slate-900 dark:text-white text-lg">
                                            ₹{(item.price * item.quantity).toFixed(0)}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4 text-xs font-black text-slate-400 uppercase tracking-widest border-t border-slate-100 dark:border-slate-800 pt-8">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-slate-900 dark:text-slate-300">₹{pricing.subtotal.toFixed(0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Extras (Tax/Fees)</span>
                                    <span className="text-slate-900 dark:text-slate-300">₹{(pricing.deliveryFee + pricing.platformFee + pricing.tax).toFixed(0)}</span>
                                </div>
                                
                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            disabled={!!appliedPromo}
                                            value={appliedPromo ? appliedPromo.code : promoCode}
                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                            placeholder="Promo Code"
                                            className="flex-1 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 p-4 rounded-xl uppercase focus:ring-2 focus:ring-blue-100 outline-none font-black text-xs tracking-widest"
                                        />
                                        {appliedPromo ? (
                                            <button
                                                type="button"
                                                onClick={() => { setAppliedPromo(null); setPromoCode(""); }}
                                                className="px-6 bg-rose-50 text-rose-600 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-rose-100 transition-colors"
                                            >
                                                Remove
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={applyingPromo || !promoCode.trim()}
                                                onClick={handleApplyPromo}
                                                className="px-6 bg-slate-900 text-white font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-black disabled:opacity-50 transition-colors"
                                            >
                                                {applyingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                            </button>
                                        )}
                                    </div>
                                    {appliedPromo && (
                                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black text-emerald-500 mt-2 px-2 uppercase tracking-tight">
                                            Promo applied: -₹{appliedPromo.discountAmount.toFixed(0)}
                                        </motion.p>
                                    )}
                                </div>

                                {useWallet && walletUsed > 0 && (
                                    <div className="flex justify-between items-center text-sm font-black text-blue-600 pt-2">
                                        <span className="normal-case">Wallet Usage</span>
                                        <span>-₹{walletUsed.toFixed(0)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-end pt-8 border-t border-slate-950/5 dark:border-white/5">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</p>
                                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                        <span className="text-blue-600 italic">₹</span><span className="text-gradient">{finalTotal.toFixed(0)}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

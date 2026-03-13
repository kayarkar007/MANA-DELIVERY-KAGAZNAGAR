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

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, cartTotal, clearCart } = useCart();
    const { data: session } = useSession();
    const pricing = calculatePricing(cartTotal);

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [locating, setLocating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cod" | "upi">("cod");
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div className="max-w-3xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-6 font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to Shopping
                </Link>

                <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">Checkout</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Delivery Form */}
                    <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 h-fit transition-colors">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Delivery Details</h2>

                        <form onSubmit={handlePlaceOrder} className="space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    <User className="w-4 h-4" /> Full Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl flex-1 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 outline-none transition-all font-medium bg-gray-50 dark:bg-gray-800"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    <Phone className="w-4 h-4" /> WhatsApp Number
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={form.whatsapp}
                                    onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                                    className="w-full border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl flex-1 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 outline-none transition-all font-medium bg-gray-50 dark:bg-gray-800"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                                        <MapPin className="w-4 h-4" /> Delivery Address
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleLocate}
                                        disabled={locating}
                                        className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50 transition-colors bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full"
                                    >
                                        {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
                                        {locating ? "Locating..." : "Auto Locate"}
                                    </button>
                                </div>
                                <textarea
                                    required
                                    rows={3}
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    placeholder="Enter your full building and street address..."
                                    className="w-full border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl flex-1 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:border-blue-500 outline-none transition-all font-medium bg-gray-50 dark:bg-gray-800 resize-none"
                                />
                            </div>

                            {/* Payment Method Section */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Method</h3>

                                {walletBalance > 0 && (
                                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-4 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">Localu Wallet Balance</p>
                                                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">Available: ₹{walletBalance.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={useWallet} onChange={() => setUseWallet(!useWallet)} />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                )}

                                {finalTotal > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("cod")}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === "cod" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700"}`}
                                        >
                                            <Banknote className="w-6 h-6 mb-2" />
                                            <span className="font-bold text-sm text-center">Cash on Delivery</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPaymentMethod("upi")}
                                            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${paymentMethod === "upi" ? "border-blue-600 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-blue-300 dark:hover:border-blue-700"}`}
                                        >
                                            <CreditCard className="w-6 h-6 mb-2" />
                                            <span className="font-bold text-sm text-center">Manual UPI (0% Fee)</span>
                                        </button>
                                    </div>
                                )}

                                {paymentMethod === "upi" && (
                                    <div className="bg-gray-50 p-6 rounded-2xl border border-blue-100 animate-in fade-in zoom-in-95 duration-300">
                                        <p className="text-sm text-gray-600 mb-4 text-center font-medium">Scan the QR code below using any UPI app (GPay, PhonePe, Paytm) to pay <strong className="text-blue-600">₹{finalTotal.toFixed(2)}</strong>.</p>

                                        <div className="flex justify-center mb-6">
                                            <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-200">
                                                {/* Replace with actual UPI ID of the owner */}
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=7659989336@jupiteraxis&pn=LocaluDelivery&am=${finalTotal.toFixed(2)}&cu=INR`}
                                                    alt="UPI QR Code"
                                                    className="w-40 h-40 object-contain"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                                Transaction ID (UTR Number)
                                            </label>
                                            <input
                                                type="text"
                                                required={paymentMethod === "upi"}
                                                value={transactionId}
                                                onChange={e => setTransactionId(e.target.value)}
                                                placeholder="e.g. 312345678901"
                                                className="w-full border border-gray-200 text-gray-900 p-3 rounded-xl flex-1 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium bg-white"
                                            />
                                            <p className="text-xs text-gray-500 mt-2">Enter the 12-digit transaction ID after successful payment.</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={placingOrder}
                                className="w-full mt-4 bg-blue-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-lg shadow-blue-600/20"
                            >
                                {placingOrder ? <Loader2 className="w-5 h-5 animate-spin" /> : "Confirm Order"}
                            </button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                        <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                            {cart.map((item) => (
                                <div key={item.productId} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                                    <div className="flex-1">
                                        <div className="font-bold text-gray-900">{item.name}</div>
                                        <div className="text-sm text-gray-500">Qty: {item.quantity} × ₹{item.price}</div>
                                    </div>
                                    <div className="font-bold text-gray-900">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 text-sm text-gray-500 font-medium border-t pt-6 mb-6">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="text-gray-800">₹{pricing.subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Delivery Fee</span>
                                <span className="text-gray-800">₹{pricing.deliveryFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Platform Fee</span>
                                <span className="text-gray-800">₹{pricing.platformFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (5%)</span>
                                <span className="text-gray-800">₹{pricing.tax.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Promo Code Input */}
                        <div className="mb-6">
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    disabled={!!appliedPromo}
                                    value={appliedPromo ? appliedPromo.code : promoCode}
                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                    placeholder="Enter Promo Code"
                                    className="flex-1 border border-gray-200 p-3 rounded-xl uppercase focus:ring-2 focus:ring-blue-100 outline-none"
                                />
                                {appliedPromo ? (
                                    <button
                                        type="button"
                                        onClick={() => { setAppliedPromo(null); setPromoCode(""); }}
                                        className="px-4 bg-red-50 text-red-600 font-bold rounded-xl whitespace-nowrap"
                                    >
                                        Remove
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={applyingPromo || !promoCode.trim()}
                                        onClick={handleApplyPromo}
                                        className="px-6 bg-gray-900 text-white font-bold rounded-xl whitespace-nowrap hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        {applyingPromo ? <Loader2 className="w-5 h-5 animate-spin" /> : "Apply"}
                                    </button>
                                )}
                            </div>
                            {appliedPromo && (
                                <p className="text-xs font-bold text-green-600 flex items-center gap-1">
                                    <Tag className="w-3.5 h-3.5" /> Promo applied: -₹{appliedPromo.discountAmount.toFixed(2)}
                                </p>
                            )}
                        </div>

                        {useWallet && walletUsed > 0 && (
                            <div className="flex justify-between items-center text-sm font-bold text-blue-600 mb-2">
                                <span>Wallet Applied</span>
                                <span>-₹{walletUsed.toFixed(2)}</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center font-black text-2xl pt-4 border-t text-gray-900">
                            <span>Total</span>
                            <span className="text-blue-600">₹{finalTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

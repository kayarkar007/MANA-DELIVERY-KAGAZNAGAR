"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
    ArrowLeft,
    Banknote,
    Copy,
    CreditCard,
    Loader2,
    LocateFixed,
    MapPin,
    Phone,
    Tag,
    User,
    Wallet,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { calculatePricing, formatCurrency } from "@/lib/utils";

type PaymentMethod = "cod" | "upi" | "wallet";

export default function CheckoutPage() {
    const router = useRouter();
    const { cart, cartTotal, clearCart } = useCart();
    const { data: session, status } = useSession();
    const pricing = calculatePricing(cartTotal);
    const upiId = process.env.NEXT_PUBLIC_UPI_ID || "";

    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);
    const [locating, setLocating] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
    const [transactionId, setTransactionId] = useState("");
    const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
    const [promoCode, setPromoCode] = useState("");
    const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountAmount: number } | null>(null);
    const [applyingPromo, setApplyingPromo] = useState(false);
    const [tipAmount, setTipAmount] = useState(0);
    const [walletBalance, setWalletBalance] = useState(0);
    const [useWallet, setUseWallet] = useState(false);
    const [form, setForm] = useState({
        name: "",
        whatsapp: "",
        address: "",
        lat: 17.385,
        lng: 78.4867,
    });

    useEffect(() => {
        if (status === "unauthenticated") {
            setLoading(false);
            router.replace("/login");
            return;
        }

        if (status !== "authenticated") return;

        const bootstrap = async () => {
            try {
                const profileRes = await fetch("/api/user/profile");
                const data = await profileRes.json();
                if (data.success && data.data) {
                    setForm((prev) => ({
                        ...prev,
                        name: data.data.name || session?.user?.name || "",
                        whatsapp: data.data.whatsapp || "",
                        address: data.data.address || "",
                    }));
                    setWalletBalance(Number(data.data.walletBalance) || 0);
                    setSavedAddresses(data.data.savedAddresses || []);
                }
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, [status, session, router]);

    const preWalletTotal = Math.max(0, pricing.total + tipAmount - (appliedPromo?.discountAmount || 0));
    const walletUsed = useWallet ? Math.min(walletBalance, preWalletTotal) : 0;
    const finalTotal = Math.max(0, preWalletTotal - walletUsed);

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
                    if (data?.display_name) {
                        setForm((prev) => ({ ...prev, address: data.display_name, lat: latitude, lng: longitude }));
                        toast.success("Location found");
                    } else {
                        toast.error("Could not fetch address details.");
                    }
                } catch {
                    toast.error("Failed to connect to location services.");
                } finally {
                    setLocating(false);
                }
            },
            () => {
                toast.error("Please allow location access in your browser.");
                setLocating(false);
            }
        );
    };

    const handleApplyPromo = async () => {
        if (!promoCode.trim()) return;

        setApplyingPromo(true);
        try {
            const res = await fetch("/api/promo/validate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code: promoCode, cartTotal: pricing.subtotal }),
            });
            const data = await res.json();

            if (data.success) {
                setAppliedPromo(data.data);
                toast.success(data.data.message);
            } else {
                setAppliedPromo(null);
                toast.error(data.error || "Invalid promo code");
            }
        } catch {
            toast.error("Failed to validate promo code");
        } finally {
            setApplyingPromo(false);
        }
    };

    const createApplicationOrder = async (method: PaymentMethod, txId?: string) => {
        const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "product",
                userId: session?.user?.id,
                customerName: form.name,
                customerPhone: form.whatsapp,
                address: form.address,
                latitude: form.lat,
                longitude: form.lng,
                items: cart.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                })),
                subtotal: pricing.subtotal,
                deliveryFee: pricing.deliveryFee,
                platformFee: pricing.platformFee,
                tax: pricing.tax,
                discountAmount: appliedPromo?.discountAmount || 0,
                promoCode: appliedPromo?.code,
                walletUsed,
                tipAmount,
                total: finalTotal,
                paymentMethod: finalTotal === 0 ? "wallet" : method,
                transactionId: txId,
            }),
        });

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error || "Failed to place order.");
        }

        return data;
    };

    const finalizeSuccessfulOrder = (orderResponse: any, description = "Redirecting to your orders...") => {
        clearCart();
        if (orderResponse.redirectUrl) {
            window.open(orderResponse.redirectUrl, "_blank");
        }
        toast.success("Order placed successfully", { description });
        setTimeout(() => router.push("/profile"), 900);
    };

    const handlePlaceOrder = async (event: React.FormEvent) => {
        event.preventDefault();
        setPlacingOrder(true);

        if (paymentMethod === "upi" && !upiId) {
            toast.error("UPI ID is not configured.");
            setPlacingOrder(false);
            return;
        }

        if (paymentMethod === "upi" && !transactionId.trim()) {
            toast.error("Please enter the UPI transaction ID.");
            setPlacingOrder(false);
            return;
        }

        try {
            const data = await createApplicationOrder(paymentMethod, paymentMethod === "upi" ? transactionId : undefined);
            finalizeSuccessfulOrder(data);
        } catch (error: any) {
            toast.error(error.message || "An error occurred while placing your order.");
        } finally {
            setPlacingOrder(false);
        }
    };

    if (status === "unauthenticated") {
        return null;
    }

    if (loading || status === "loading") {
        return (
            <div className="flex justify-center py-16">
                <div className="app-card flex items-center gap-3 rounded-[1.6rem] px-5 py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-red-600" />
                    <span className="text-sm font-black text-slate-600 dark:text-slate-300">Preparing checkout...</span>
                </div>
            </div>
        );
    }

    if (!cart.length) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="app-card max-w-md rounded-[2rem] p-8 text-center">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">Cart is empty</h2>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                        Add a few products before checkout.
                    </p>
                    <Link href="/" className="app-button app-button-primary mt-8 rounded-[1.2rem]">
                        Start shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <section className="app-card-strong px-5 py-6 sm:px-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                        <Link href="/" className="app-button app-button-secondary w-fit rounded-[1.1rem]">
                            <ArrowLeft className="h-4 w-4" />
                            Back to store
                        </Link>
                        <div>
                            <span className="app-kicker">Fast checkout</span>
                            <h1 className="app-title mt-3 text-4xl text-slate-900 dark:text-white sm:text-5xl">Confirm your order</h1>
                            <p className="app-subtitle mt-3 max-w-2xl">
                                Mobile-first review flow with delivery details, wallet support, promo handling, and UPI confirmation in one place.
                            </p>
                        </div>
                    </div>

                    <div className="app-panel w-full max-w-xs px-5 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Payable now</p>
                        <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(finalTotal)}</p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
                <aside className="order-1 lg:order-2 lg:sticky lg:top-24">
                    <div className="app-card rounded-[2rem] p-5 sm:p-6">
                        <div className="flex items-center gap-2">
                            <Tag className="h-5 w-5 text-red-600" />
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Order Summary</h2>
                        </div>

                        <div className="mt-5 space-y-4">
                            {cart.map((item) => (
                                <div key={item.productId} className="flex items-start justify-between gap-3 rounded-[1.35rem] border border-slate-200/80 bg-white/70 p-3.5 dark:border-slate-800/90 dark:bg-slate-950/60">
                                    <div className="min-w-0">
                                        <p className="line-clamp-2 font-black text-slate-900 dark:text-white">{item.name}</p>
                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                            Qty {item.quantity} • {formatCurrency(item.price)} each
                                        </p>
                                    </div>
                                    <p className="shrink-0 text-sm font-black text-slate-900 dark:text-white">
                                        {formatCurrency(item.price * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 space-y-3 border-t border-slate-200/80 pt-5 text-sm dark:border-slate-800/90">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Subtotal</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(pricing.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400">Delivery, fees and tax</span>
                                <span className="font-semibold text-slate-900 dark:text-white">
                                    {formatCurrency(pricing.deliveryFee + pricing.platformFee + pricing.tax)}
                                </span>
                            </div>
                            {tipAmount > 0 && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-300">
                                    <span>Tip</span>
                                    <span>{formatCurrency(tipAmount)}</span>
                                </div>
                            )}
                            {appliedPromo && (
                                <div className="flex justify-between text-emerald-600 dark:text-emerald-300">
                                    <span>Promo discount</span>
                                    <span>-{formatCurrency(appliedPromo.discountAmount)}</span>
                                </div>
                            )}
                            {useWallet && walletUsed > 0 && (
                                <div className="flex justify-between text-red-600 dark:text-red-300">
                                    <span>Wallet used</span>
                                    <span>-{formatCurrency(walletUsed)}</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-5 rounded-[1.5rem] bg-[linear-gradient(135deg,var(--primary),var(--primary-strong))] px-5 py-4 text-white">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Total</p>
                            <p className="mt-2 text-3xl font-black">{formatCurrency(finalTotal)}</p>
                        </div>
                    </div>
                </aside>

                <form onSubmit={handlePlaceOrder} className="order-2 space-y-6 lg:order-1">
                    <section className="app-card rounded-[2rem] p-5 sm:p-6 md:p-8">
                        <div className="mb-5">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Delivery details</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Keep this short and accurate so the rider can reach you without delays.</p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 inline-flex items-center gap-2">
                                    <User className="h-3.5 w-3.5" /> Receiver name
                                </span>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    className="app-input text-sm font-semibold"
                                />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 inline-flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5" /> WhatsApp
                                </span>
                                <input
                                    value={form.whatsapp}
                                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                                    required
                                    className="app-input text-sm font-semibold"
                                />
                            </label>
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 inline-flex items-center gap-2">
                                    <MapPin className="h-3.5 w-3.5" /> Address
                                </span>
                                <button type="button" onClick={handleLocate} disabled={locating} className="app-button app-button-secondary rounded-[1rem] px-3 py-2 text-[10px]">
                                    {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LocateFixed className="h-3.5 w-3.5" />}
                                    Auto detect
                                </button>
                            </div>
                            <textarea
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                                required
                                rows={3}
                                className="app-textarea text-sm font-semibold"
                            />
                            {savedAddresses.length > 0 && (
                                <select
                                    defaultValue=""
                                    onChange={(e) => {
                                        const selected = savedAddresses.find((item) => item._id === e.target.value);
                                        if (selected) {
                                            setForm({ ...form, address: selected.address, lat: selected.lat, lng: selected.lng });
                                        }
                                    }}
                                    className="app-select text-sm font-semibold"
                                >
                                    <option value="">Choose saved address</option>
                                    {savedAddresses.map((item) => (
                                        <option key={item._id} value={item._id}>
                                            {item.label} - {item.address}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </section>

                    <section className="app-card rounded-[2rem] p-5 sm:p-6 md:p-8">
                        <div className="mb-5">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Offers and tip</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Keep checkout smooth with optional promo and rider tip controls.</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Promo code</span>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <input
                                        value={appliedPromo ? appliedPromo.code : promoCode}
                                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                        disabled={!!appliedPromo}
                                        placeholder="ENTER CODE"
                                        className="app-input flex-1 text-sm font-semibold uppercase"
                                    />
                                    {appliedPromo ? (
                                        <button type="button" onClick={() => { setAppliedPromo(null); setPromoCode(""); }} className="app-button app-button-secondary rounded-[1rem]">
                                            Remove
                                        </button>
                                    ) : (
                                        <button type="button" onClick={handleApplyPromo} disabled={applyingPromo || !promoCode.trim()} className="app-button app-button-primary rounded-[1rem] disabled:opacity-50">
                                            {applyingPromo ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Rider tip</span>
                                <div className="flex flex-wrap gap-2">
                                    {[0, 10, 20, 50].map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => setTipAmount(amount)}
                                            className={`rounded-[1rem] px-4 py-2.5 text-sm font-black transition ${tipAmount === amount ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300"}`}
                                        >
                                            {amount === 0 ? "No tip" : formatCurrency(amount)}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {walletBalance > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setUseWallet((prev) => !prev)}
                                    className={`w-full rounded-[1.45rem] border p-4 text-left transition ${useWallet ? "border-[color:var(--primary)] bg-red-50/80 dark:bg-red-950/20" : "border-slate-200/80 bg-white/65 dark:border-slate-800/90 dark:bg-slate-950/50"}`}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/12 text-red-600 dark:text-red-300">
                                                <Wallet className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 dark:text-white">Apply wallet</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">Available balance: {formatCurrency(walletBalance)}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.16em] text-red-600 dark:text-red-300">
                                            {useWallet ? "Applied" : "Tap to use"}
                                        </span>
                                    </div>
                                </button>
                            )}
                        </div>
                    </section>

                    <section className="app-card rounded-[2rem] p-5 sm:p-6 md:p-8">
                        <div className="mb-5">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Payment method</h2>
                            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Choose the simplest option for this order.</p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                            {[
                                { id: "cod", label: "Cash on delivery", hint: "Pay when the order arrives", icon: Banknote },
                                { id: "upi", label: "Manual UPI", hint: "Scan QR and submit UTR", icon: CreditCard },
                            ].map((option) => {
                                const Icon = option.icon;
                                const selected = paymentMethod === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => setPaymentMethod(option.id as PaymentMethod)}
                                        className={`rounded-[1.45rem] border p-4 text-left transition ${selected ? "border-[color:var(--primary)] bg-red-50/80 dark:bg-red-950/20" : "border-slate-200/80 bg-white/65 dark:border-slate-800/90 dark:bg-slate-950/50"}`}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300">
                                            <Icon className={`h-5 w-5 ${selected ? "text-red-600 dark:text-red-300" : ""}`} />
                                        </div>
                                        <p className="mt-4 font-black text-slate-900 dark:text-white">{option.label}</p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{option.hint}</p>
                                    </button>
                                );
                            })}
                        </div>

                        {paymentMethod === "upi" && (
                            <div className="mt-5 rounded-[1.6rem] border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800/90 dark:bg-slate-950/60 sm:p-5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-black text-slate-900 dark:text-white">Pay to UPI</p>
                                        <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">
                                            {upiId || "UPI ID is missing in environment settings"}
                                        </p>
                                    </div>
                                    {upiId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(upiId);
                                                toast.success("UPI ID copied");
                                            }}
                                            className="app-button app-button-secondary rounded-[1rem] px-3 py-2 text-[10px]"
                                        >
                                            <Copy className="h-3.5 w-3.5" />
                                            Copy UPI ID
                                        </button>
                                    )}
                                </div>

                                {upiId ? (
                                    <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <div className="mx-auto rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm sm:mx-0">
                                            <img
                                                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent("Mana Delivery")}&am=${finalTotal.toFixed(2)}&cu=INR`}
                                                alt="UPI QR"
                                                className="h-40 w-40 object-contain sm:h-44 sm:w-44"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                                                Scan the QR, pay the exact amount, then paste your transaction reference below.
                                            </p>
                                            <input
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                                placeholder="Enter UTR / reference number"
                                                className="app-input text-sm font-semibold"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="mt-4 text-sm text-rose-600 dark:text-rose-300">
                                        `NEXT_PUBLIC_UPI_ID` is missing. Add it in environment settings first.
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    <button type="submit" disabled={placingOrder} className="app-button app-button-primary flex w-full justify-center rounded-[1.4rem] py-4 text-sm disabled:opacity-50">
                        {placingOrder ? <Loader2 className="h-5 w-5 animate-spin" /> : "Place order"}
                    </button>
                </form>
            </div>
        </div>
    );
}

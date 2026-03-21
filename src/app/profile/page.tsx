"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Phone, MapPin, Package, LogOut, Loader2, ArrowLeft, CheckCircle2, Truck, Clock, Wallet, Star, Heart, Navigation, ChevronRight, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { toast } from "sonner";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [reviewOrder, setReviewOrder] = useState<string | null>(null);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviews, setReviews] = useState<any[]>([]);
    const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

    // Address Book State
    const [managingAddresses, setManagingAddresses] = useState(false);
    const [newAddressForm, setNewAddressForm] = useState(false);
    const [newAddress, setNewAddress] = useState({ label: "Home", address: "", lat: 17.3850, lng: 78.4867 });
    const [addressLocating, setAddressLocating] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }

        if (status === "authenticated") {
            // Fetch User Details
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setProfile(data.data);
                    }
                });

            // Fetch User Orders
            fetch(`/api/orders?userId=${session.user.id}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setOrders(data.data);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));

            fetch("/api/reviews/user")
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setReviews(data.data);
                    }
                });
        }
    }, [status, session, router]);

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmittingReview(true);
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: reviewOrder, rating, comment })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Review submitted successfully!");
                setReviews([...reviews, data.data]);
                setReviewOrder(null);
                setRating(5);
                setComment("");
            } else {
                toast.error(data.error || "Failed to submit review");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!confirm("Are you sure you want to cancel this order?")) return;
        setCancellingOrder(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
            const data = await res.json();
            if (data.success) {
                setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "cancelled", deliveryStatus: "cancelled" } : o));
                toast.success("Order cancelled successfully.");
            } else {
                toast.error(data.error || "Failed to cancel order.");
            }
        } catch {
            toast.error("Error cancelling order.");
        } finally {
            setCancellingOrder(null);
        }
    };

    const handleLocateAddress = () => {
        setAddressLocating(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await res.json();
                    if (data?.display_name) {
                        setNewAddress({ ...newAddress, address: data.display_name, lat: latitude, lng: longitude });
                        toast.success("Location found!");
                    }
                } finally {
                    setAddressLocating(false);
                }
            },
            () => {
                toast.error("Location access denied.");
                setAddressLocating(false);
            }
        );
    };

    const handleAddAddress = async () => {
        if (!newAddress.address) return toast.error("Please enter an address");
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "ADD_ADDRESS", addressData: newAddress })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                setNewAddressForm(false);
                setNewAddress({ label: "Home", address: "", lat: 17.3850, lng: 78.4867 });
                toast.success("Address added safely!");
            }
        } catch { toast.error("Error adding address"); }
    };

    const handleDeleteAddress = async (id: string) => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "DELETE_ADDRESS", addressId: id })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                toast.success("Address removed.");
            }
        } catch { toast.error("Error removing address"); }
    };

    const handleSetDefaultAddress = async (addr: any) => {
        try {
            const res = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "SET_DEFAULT", addressData: addr })
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.data);
                toast.success("Default address updated!");
            }
        } catch { toast.error("Error updating default address"); }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-pulse flex items-center justify-center p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800">
                    <img src="/logo.png" alt="Loading Localu..." className="w-12 h-12 sm:w-16 sm:h-16 object-contain drop-shadow-xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 py-6 sm:py-10 md:py-20 px-4 sm:px-6 lg:px-8 font-sans transition-colors duration-300">
            <div className="max-w-6xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all mb-10 font-black uppercase tracking-widest text-[10px]">
                    <ArrowLeft className="w-4 h-4" /> Back to Store
                </Link>

                <div className="flex flex-col lg:flex-row gap-12">

                    {/* Sidebar / Profile Card */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-1/3"
                    >
                        <div className="glass-card p-10 border-white/20 premium-shadow rounded-[3.5rem] text-center sticky top-24">
                            <div className="relative inline-block mb-6">
                                <div className="w-32 h-32 bg-gradient-to-br from-red-600 to-rose-400 text-white rounded-[2.5rem] flex items-center justify-center mx-auto text-5xl font-black shadow-2xl shadow-red-500/40">
                                    {session?.user?.name?.charAt(0)}
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-10 h-10 rounded-2xl border-4 border-white dark:border-slate-900 flex items-center justify-center shadow-lg">
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{session?.user?.name}</h2>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-10">{session?.user?.email}</p>

                            <div className="space-y-4 text-left">
                                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 group hover:border-red-200 transition-colors">
                                    <div className="flex items-center gap-4 mb-2">
                                        <div className="bg-red-600 text-white p-2.5 rounded-2xl">
                                            <Wallet className="w-5 h-5" />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mana Wallet</p>
                                    </div>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">
                                        <span className="text-red-600 text-xl italic mr-1">₹</span>
                                        <span className="text-gradient">{profile?.walletBalance?.toFixed(0) || "0"}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Phone className="w-3 h-3" /> WhatsApp
                                        </p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {profile?.whatsapp || "NOT LINKED"}
                                        </p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-rose-500/10 shadow-lg shadow-rose-500/5 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-linear-to-r from-red-600/10 to-rose-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
                                            <ShieldAlert className="w-3 h-3" /> 24/7 Support Desk
                                        </p>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight relative z-10">
                                            +91 9494378247
                                        </p>
                                    </div>
                                    <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 relative">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <MapPin className="w-3 h-3" /> Default Address
                                            </p>
                                            <button onClick={() => setManagingAddresses(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                                                Manage Book
                                            </button>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                            {profile?.address || "No default address set"}
                                        </p>
                                    </div>
                                </div>

                                <Link href="/profile/wishlist" className="flex items-center justify-between p-6 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-3xl group transition-all hover:bg-rose-100 dark:hover:bg-rose-900/20">
                                    <div className="flex items-center gap-4">
                                        <Heart className="w-6 h-6 text-rose-500 fill-rose-500 group-hover:scale-125 transition-transform" />
                                        <span className="font-black text-rose-900 dark:text-rose-400 uppercase tracking-widest text-xs">My Favorites</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-rose-500 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            </div>

                            <button
                                onClick={() => signOut()}
                                className="w-full mt-10 flex items-center justify-center gap-3 text-slate-400 font-black p-5 rounded-2xl hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all uppercase tracking-widest text-[10px]"
                            >
                                <LogOut className="w-4 h-4" /> Secure Sign Out
                            </button>
                        </div>
                    </motion.div>

                    {/* Main Content / Orders */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full lg:w-2/3 space-y-10"
                    >
                        <div className="flex items-end justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
                                <Package className="w-10 h-10 text-blue-600" /> Recent <span className="text-gradient">Orders</span>
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{orders.length} total</p>
                        </div>

                        {orders.length === 0 ? (
                            <div className="glass-card p-20 text-center border-white/20 premium-shadow rounded-[3rem]">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <Package className="w-12 h-12 text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No past orders</h3>
                                <p className="text-slate-400 font-bold mb-10 max-w-xs mx-auto text-sm uppercase tracking-tight">Your order history is empty. Let's find something delicious!</p>
                                <Link href="/" className="inline-block bg-blue-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-blue-700 transition-all uppercase tracking-widest text-xs shadow-xl shadow-blue-500/40">
                                    Start Browsing
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {orders.map((order, index) => {
                                    const statusList = ["pending", "processing", "shipped", "delivered"];
                                    const currentStatusIndex = statusList.indexOf(order.status) !== -1 ? statusList.indexOf(order.status) : 0;
                                    const isCancelled = order.status === "cancelled";
                                    const hasReviewed = reviews.some(r => r.orderId === order._id);

                                    return (
                                        <motion.div 
                                            key={order._id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="glass-card p-5 sm:p-8 md:p-10 border-white/20 premium-shadow rounded-3xl md:rounded-[3rem] group hover:border-blue-500/30 transition-all overflow-hidden relative"
                                        >
                                            {/* Decorative Background Element */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors" />

                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-6 mb-10 relative z-10">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-1 text-[10px] font-black tracking-[0.2em] rounded-lg uppercase shadow-lg">
                                                            #ORD-{order._id.slice(-6).toUpperCase()}
                                                        </span>
                                                        <span className={`px-4 py-1 text-[10px] font-black rounded-lg uppercase tracking-tight ${order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                                                            order.status === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        Arrived on {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short', day: 'numeric', year: 'numeric'
                                                        })} · {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex flex-col items-end gap-2">
                                                    {order.deliveryOtp && !isCancelled && order.status !== 'delivered' && order.deliveryStatus !== 'delivered' && (
                                                        <div className="mb-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl border border-blue-100 dark:border-blue-800 text-right">
                                                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Delivery PIN</p>
                                                            <p className="text-xl font-black text-blue-600 dark:text-blue-400 tracking-[0.2em] leading-none">{order.deliveryOtp}</p>
                                                        </div>
                                                    )}
                                                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                                                        <span className="text-blue-600 text-xl italic mr-1">₹</span>{order.total}
                                                    </p>
                                                    <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                                        {order.paymentMethod === 'upi' ? 'Secure UPI' : 'COD'} · {order.items?.length || 0} ITEMS {order.tipAmount ? `· +₹${order.tipAmount} TIP 💝` : ''}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Order Progress */}
                                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-slate-100 dark:border-slate-800 mb-6 sm:mb-10 relative">
                                                <div className="relative flex justify-between h-12 items-center">
                                                    {/* Progress Line Track */}
                                                    <div className="absolute left-[12.5%] right-[12.5%] top-1/2 -mt-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        {!isCancelled && (
                                                            <motion.div 
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${(currentStatusIndex / (statusList.length - 1)) * 100}%` }}
                                                                className="h-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]"
                                                            />
                                                        )}
                                                    </div>

                                                    {isCancelled ? (
                                                        <div className="w-full flex justify-center z-10">
                                                            <div className="bg-rose-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/30">
                                                                Order Terminated
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        statusList.map((step, idx) => {
                                                            const isCompleted = idx <= currentStatusIndex;
                                                            const isActive = idx === currentStatusIndex;

                                                            let Icon = Clock;
                                                            if (step === 'processing') Icon = Package;
                                                            if (step === 'shipped') Icon = Truck;
                                                            if (step === 'delivered') Icon = CheckCircle2;

                                                            return (
                                                                <div key={step} className="flex flex-col items-center gap-3 z-10 w-1/4">
                                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-[1.25rem] flex items-center justify-center border-4 border-white dark:border-slate-900 transition-all duration-500 ${isCompleted ? 'bg-blue-600 text-white scale-110 shadow-lg shadow-blue-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-300'
                                                                        } ${isActive ? 'ring-4 sm:ring-8 ring-blue-500/10' : ''}`}>
                                                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                                    </div>
                                                                    <span className={`text-[9px] sm:text-[10px] font-black tracking-tighter sm:tracking-widest uppercase transition-colors text-center w-full leading-tight px-0.5 sm:px-1 ${isCompleted ? 'text-slate-900 dark:text-white' : 'text-slate-300 dark:text-slate-700'
                                                                        }`}>
                                                                        {step.replace(/_/g, " ")}
                                                                    </span>
                                                                </div>
                                                            )
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4">
                                                {["processing", "shipped"].includes(order.status) && (
                                                    <Link 
                                                        href={`/track/${order._id}`}
                                                        className="flex-1 min-w-[130px] bg-blue-600 text-white h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95"
                                                    >
                                                        <Navigation className="w-4 h-4" /> Live Tracking
                                                    </Link>
                                                )}
                                                
                                                {order.status === "delivered" && !hasReviewed && reviewOrder !== order._id && (
                                                    <button
                                                        onClick={() => setReviewOrder(order._id)}
                                                        className="flex-1 min-w-[130px] bg-amber-50 dark:bg-amber-900/10 text-amber-600 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-100 transition-all flex items-center justify-center gap-2 border border-amber-100 dark:border-amber-900/20"
                                                    >
                                                        <Star className="w-4 h-4" /> Rate Experience
                                                    </button>
                                                )}

                                                {/* ✅ Feature: Cancel Order button for pending orders */}
                                                {order.status === "pending" && (
                                                    <button
                                                        onClick={() => handleCancelOrder(order._id)}
                                                        disabled={cancellingOrder === order._id}
                                                        className="flex-1 min-w-[130px] bg-rose-50 dark:bg-rose-900/10 text-rose-600 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-all flex items-center justify-center gap-2 border border-rose-100 dark:border-rose-900/20 disabled:opacity-50"
                                                    >
                                                        {cancellingOrder === order._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cancel Order"}
                                                    </button>
                                                )}

                                                <button className="flex-1 min-w-[130px] bg-slate-50 dark:bg-slate-900/50 text-slate-400 h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2 border border-slate-100 dark:border-slate-800/50">
                                                    Need Help?
                                                </button>
                                            </div>

                                            {/* Expandable Review Form */}
                                            <AnimatePresence>
                                                {reviewOrder === order._id && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="mt-10 overflow-hidden"
                                                    >
                                                        <div className="pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
                                                            <div className="flex items-center justify-between">
                                                                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Review Order</h4>
                                                                <button onClick={() => setReviewOrder(null)} className="text-rose-500 font-black text-[10px] uppercase tracking-widest">Discard</button>
                                                            </div>

                                                            <div className="flex gap-4 justify-center py-4 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800/20 shadow-inner">
                                                                {[1, 2, 3, 4, 5].map((star) => (
                                                                    <button
                                                                        key={star}
                                                                        type="button"
                                                                        onClick={() => setRating(star)}
                                                                        className={`p-3 rounded-2xl transition-all ${rating >= star ? 'bg-amber-100 text-amber-500 scale-110 shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-800 text-slate-200'}`}
                                                                    >
                                                                        <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                                                                    </button>
                                                                ))}
                                                            </div>

                                                            <form onSubmit={handleSubmitReview} className="space-y-6">
                                                                <textarea
                                                                    value={comment}
                                                                    onChange={e => setComment(e.target.value)}
                                                                    placeholder="Describe your delivery experience..."
                                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] text-sm focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none resize-none font-bold placeholder:italic shadow-inner"
                                                                    rows={4}
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    disabled={submittingReview}
                                                                    className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] rounded-3xl hover:opacity-90 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                                                >
                                                                    {submittingReview ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Review"}
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>

                </div>
            </div>

            {/* Address Book Modal */}
            <AnimatePresence>
                {managingAddresses && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-950 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden glass-card border-white/20 premium-shadow"
                        >
                            <div className="p-8 pb-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <MapPin className="w-6 h-6 text-blue-600" /> Address Book
                                </h3>
                                <button onClick={() => setManagingAddresses(false)} className="w-10 h-10 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors font-black">
                                    ✕
                                </button>
                            </div>

                            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 custom-scrollbar">
                                {profile?.savedAddresses?.length === 0 && !newAddressForm && (
                                    <div className="text-center py-10">
                                        <p className="text-slate-500 font-bold mb-4 text-sm">No saved addresses yet.</p>
                                        <button onClick={() => setNewAddressForm(true)} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">
                                            Add New Address
                                        </button>
                                    </div>
                                )}

                                {!newAddressForm && profile?.savedAddresses?.map((addr: any) => (
                                    <div key={addr._id} className={`p-5 rounded-2xl border-2 transition-all ${profile.address === addr.address ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-900 hover:border-slate-200 dark:hover:border-slate-800'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest leading-none">
                                                {addr.label || "Home"}
                                            </span>
                                            <div className="flex gap-2">
                                                {profile.address !== addr.address && (
                                                    <button onClick={() => handleSetDefaultAddress(addr)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                                                        Set Default
                                                    </button>
                                                )}
                                                <button onClick={() => handleDeleteAddress(addr._id)} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed">{addr.address}</p>
                                    </div>
                                ))}

                                {profile?.savedAddresses?.length > 0 && !newAddressForm && (
                                    <button onClick={() => setNewAddressForm(true)} className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest hover:border-blue-500 hover:text-blue-600 transition-all focus:outline-none focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/20">
                                        + Add New Address
                                    </button>
                                )}

                                {newAddressForm && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                        <div className="flex gap-2 mb-4">
                                            {["Home", "Work", "Other"].map(lbl => (
                                                <button key={lbl} onClick={() => setNewAddress({ ...newAddress, label: lbl })} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${newAddress.label === lbl ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-100 dark:border-slate-800 outline-none hover:bg-slate-100'}`}>
                                                    {lbl}
                                                </button>
                                            ))}
                                        </div>
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Full Address</label>
                                                <button onClick={handleLocateAddress} disabled={addressLocating} className="text-[10px] font-black text-blue-600 uppercase tracking-widest disabled:opacity-50">
                                                    {addressLocating ? 'Locating...' : 'Auto Detect'}
                                                </button>
                                            </div>
                                            <textarea 
                                                rows={3}
                                                value={newAddress.address} 
                                                onChange={e => setNewAddress({ ...newAddress, address: e.target.value })}
                                                className="w-full bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl text-sm font-bold resize-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 outline-none"
                                                placeholder="Street, City, PIN..."
                                            />
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button onClick={() => setNewAddressForm(false)} className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black uppercase text-xs tracking-widest hover:opacity-80 transition-opacity">
                                                Cancel
                                            </button>
                                            <button onClick={handleAddAddress} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">
                                                Save
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );

}

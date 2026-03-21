"use client";

import { useState, useEffect } from "react";
import { Package, MapPin, ChevronDown, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = () => {
        fetch("/api/orders")
            .then(res => res.json())
            .then(data => {
                if (data.success) setOrders(data.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const fetchRiders = () => {
        fetch("/api/admin/riders")
            .then(res => res.json())
            .then(data => { if (data.success) setRiders(data.data); })
            .catch(() => { });
    };

    useEffect(() => { fetchOrders(); fetchRiders(); }, []);

    const handleRiderAssign = async (orderId: string, riderId: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ riderId })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Rider assigned!");
                fetchOrders();
                if (data.riderWhatsappUrl) window.open(data.riderWhatsappUrl, "_blank");
            } else {
                toast.error(data.error || "Failed to assign rider");
            }
        } catch { toast.error("An error occurred"); }
        finally { setUpdatingId(null); }
    };

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Order status updated!");
                fetchOrders();
                if (data.whatsappRedirectUrl) window.open(data.whatsappRedirectUrl, "_blank");
            } else {
                toast.error(data.error || "Failed to update status");
            }
        } catch { toast.error("An error occurred"); }
        finally { setUpdatingId(null); }
    };

    const statusColor: Record<string, string> = {
        delivered: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        shipped: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        processing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
        pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-16">
                <Loader2 className="w-8 h-8 animate-spin text-red-600 dark:text-red-400" />
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Manage Orders</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track and update customer delivery statuses.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm">
                        <Package className="w-4 h-4" /> {orders.length} Total
                    </div>
                    <button
                        onClick={fetchOrders}
                        className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    No orders found.
                </div>
            ) : (
                <>
                    {/* ── MOBILE CARD VIEW (< md) ── */}
                    <div className="md:hidden space-y-4">
                        {orders.map((order) => (
                            <div key={order._id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 space-y-4">
                                {/* Order ID + Date */}
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-lg">
                                        #{order._id.slice(-6).toUpperCase()}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${statusColor[order.status] || statusColor.pending}`}>
                                            {order.status}
                                        </span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Items */}
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2">
                                    {order.type === "service"
                                        ? <span className="text-purple-600 dark:text-purple-400 font-bold">{order.serviceCategory || "Service Request"}</span>
                                        : order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                                </p>

                                {/* Customer + Map */}
                                <div className="flex flex-wrap items-center gap-3">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">{order.customerName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{order.customerPhone}</p>
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                        target="_blank"
                                        className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1.5 rounded-lg"
                                    >
                                        <MapPin className="w-3 h-3" /> Map
                                    </a>
                                </div>

                                {/* Amount */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-gray-900 dark:text-white">₹{order.total}</span>
                                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">
                                        {order.paymentMethod?.toUpperCase() || "COD"}
                                        {order.tipAmount ? ` · ₹${order.tipAmount} Tip` : ""}
                                    </span>
                                </div>

                                {/* Rider Assign */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Assign Rider</label>
                                    <div className="relative">
                                        <select
                                            value={order.riderId || ""}
                                            onChange={(e) => handleRiderAssign(order._id, e.target.value)}
                                            disabled={updatingId === order._id || ["delivered", "cancelled"].includes(order.status)}
                                            className="appearance-none w-full border border-gray-200 dark:border-gray-700 font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer outline-none transition-all disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
                                        >
                                            <option value="">Unassigned</option>
                                            {riders.map((rider) => (
                                                <option key={rider._id} value={rider._id}>{rider.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                    {order.deliveryStatus && (
                                        <p className="text-[10px] font-black uppercase text-red-600 mt-1">
                                            {order.deliveryStatus.replace(/_/g, " ")}
                                        </p>
                                    )}
                                </div>

                                {/* Status Update */}
                                <div className="relative">
                                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Order Status</label>
                                    <div className="relative">
                                        <select
                                            value={order.status}
                                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                            disabled={updatingId === order._id}
                                            className={`appearance-none w-full border font-bold text-sm px-4 py-2.5 rounded-xl cursor-pointer outline-none transition-all disabled:opacity-50
                                                ${order.status === "delivered" ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" :
                                                    order.status === "cancelled" ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" :
                                                        "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"}`}
                                        >
                                            <option value="pending">🟡 Pending</option>
                                            <option value="processing">📦 Processing</option>
                                            <option value="shipped">🚚 Shipped</option>
                                            <option value="delivered">✅ Delivered</option>
                                            <option value="cancelled">❌ Cancelled</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── DESKTOP TABLE VIEW (≥ md) ── */}
                    <div className="hidden md:block bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                        <th className="p-4 pl-6 font-bold">Order Details</th>
                                        <th className="p-4 font-bold">Customer</th>
                                        <th className="p-4 font-bold">Amount</th>
                                        <th className="p-4 font-bold">Rider</th>
                                        <th className="p-4 font-bold">Status Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="p-4 pl-6 align-top">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-lg">
                                                        #{order._id.slice(-6).toUpperCase()}
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 pr-4">
                                                    {order.type === "service"
                                                        ? <span className="text-purple-600 dark:text-purple-400 font-bold">{order.serviceCategory || "Service Request"}</span>
                                                        : order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ")}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">{order.customerName}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{order.customerPhone}</p>
                                                <a
                                                    href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded-md"
                                                >
                                                    <MapPin className="w-3 h-3" /> View Map
                                                </a>
                                            </td>
                                            <td className="p-4 align-top">
                                                <p className="font-black text-gray-900 dark:text-white">₹{order.total}</p>
                                                <div className="flex flex-col gap-1 mt-1">
                                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md self-start">
                                                        {order.paymentMethod === "upi" ? "UPI" : (order.paymentMethod || "COD").toUpperCase()}
                                                        {order.tipAmount ? ` · ₹${order.tipAmount} Tip` : ""}
                                                    </span>
                                                    {order.transactionId && (
                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">Txn: {order.transactionId}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="relative inline-block w-36 xl:w-40">
                                                    <select
                                                        value={order.riderId || ""}
                                                        onChange={(e) => handleRiderAssign(order._id, e.target.value)}
                                                        disabled={updatingId === order._id || ["delivered", "cancelled"].includes(order.status)}
                                                        className="appearance-none w-full border border-gray-200 dark:border-gray-700 font-bold text-xs px-3 py-2.5 rounded-xl cursor-pointer outline-none disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"
                                                    >
                                                        <option value="">Unassigned</option>
                                                        {riders.map((rider) => (
                                                            <option key={rider._id} value={rider._id}>{rider.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                                {order.deliveryStatus && (
                                                    <p className="text-[10px] font-black uppercase text-red-600 mt-1">
                                                        {order.deliveryStatus.replace(/_/g, " ")}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="relative inline-block w-36 xl:w-40">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                        disabled={updatingId === order._id}
                                                        className={`appearance-none w-full border font-bold text-xs px-3 py-2.5 rounded-xl cursor-pointer outline-none disabled:opacity-50
                                                            ${order.status === "delivered" ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400" :
                                                                order.status === "cancelled" ? "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400" :
                                                                    "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500"}`}
                                                    >
                                                        <option value="pending">🟡 Pending</option>
                                                        <option value="processing">📦 Processing</option>
                                                        <option value="shipped">🚚 Shipped</option>
                                                        <option value="delivered">✅ Delivered</option>
                                                        <option value="cancelled">❌ Cancelled</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

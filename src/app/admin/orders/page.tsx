"use client";

import { useState, useEffect } from "react";
import { Package, Truck, CheckCircle2, Clock, XCircle, ChevronDown, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = () => {
        fetch("/api/orders")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setOrders(data.data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    const fetchRiders = () => {
        fetch("/api/admin/riders")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setRiders(data.data);
                }
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchOrders();
        fetchRiders();
    }, []);

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

                if (data.riderWhatsappUrl) {
                    window.open(data.riderWhatsappUrl, "_blank");
                }
            } else {
                toast.error(data.error || "Failed to assign rider");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setUpdatingId(null);
        }
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
                fetchOrders(); // Refresh table

                // Trigger WhatsApp redirect if available from backend
                if (data.whatsappRedirectUrl) {
                    window.open(data.whatsappRedirectUrl, "_blank");
                }
            } else {
                toast.error(data.error || "Failed to update status");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white">Manage Orders</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Track and update customer delivery statuses.</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                    <Package className="w-5 h-5" /> {orders.length} Total
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-widest text-gray-500 dark:text-gray-400">
                                <th className="p-4 pl-6 font-bold">Order Details</th>
                                <th className="p-4 font-bold hidden md:table-cell">Customer</th>
                                <th className="p-4 font-bold">Amount</th>
                                <th className="p-4 font-bold">Rider</th>
                                <th className="p-4 font-bold">Status Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {orders.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-12 text-center text-gray-500 dark:text-gray-400">
                                        No orders found.
                                    </td>
                                </tr>
                            ) : orders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group">
                                    <td className="p-4 pl-6 align-top">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                                                #{order._id.slice(-6).toUpperCase()}
                                            </span>
                                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 pr-4">
                                            {order.type === 'service'
                                                ? <span className="text-purple-600 dark:text-purple-400 font-bold">{order.serviceCategory || "Service Request"}</span>
                                                : order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(", ") || "No items"}
                                        </div>
                                    </td>

                                    <td className="p-4 align-top hidden md:table-cell">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">{order.customerName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{order.customerPhone}</p>
                                        <a
                                            href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                            target="_blank"
                                            referrerPolicy="no-referrer"
                                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md transition-colors"
                                        >
                                            <MapPin className="w-3 h-3" /> View Map
                                        </a>
                                    </td>

                                    <td className="p-4 align-top">
                                        <p className="font-black text-gray-900 dark:text-white">₹{order.total}</p>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md self-start">
                                                {order.paymentMethod === 'upi' ? 'UPI' : 'COD'}
                                            </span>
                                            {order.transactionId && (
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                                                    Txn: {order.transactionId}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4 align-top">
                                        <div className="relative inline-block w-40">
                                            <select
                                                value={order.riderId || ""}
                                                onChange={(e) => handleRiderAssign(order._id, e.target.value)}
                                                disabled={updatingId === order._id || ["delivered", "cancelled"].includes(order.status)}
                                                className="appearance-none w-full border border-gray-200 dark:border-gray-700 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer outline-none transition-all disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-500"
                                            >
                                                <option value="">Unassigned</option>
                                                {riders.map((rider) => (
                                                    <option key={rider._id} value={rider._id}>{rider.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                        </div>
                                        {order.deliveryStatus && (
                                            <p className="text-[10px] font-black uppercase text-blue-600 mt-1">
                                                {order.deliveryStatus.replace('_', ' ')}
                                            </p>
                                        )}
                                    </td>

                                    <td className="p-4 align-top">
                                        <div className="relative inline-block w-40">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                disabled={updatingId === order._id}
                                                className={`appearance-none w-full border font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer outline-none transition-all disabled:opacity-50
                                                    ${order.status === 'delivered' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 focus:ring-green-100 dark:focus:ring-green-900' :
                                                        order.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 focus:ring-red-100 dark:focus:ring-red-900' :
                                                            'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/50 focus:border-blue-500 dark:focus:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700'}
                                                `}
                                            >
                                                <option value="pending" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">🟡 Pending</option>
                                                <option value="processing" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">📦 Processing</option>
                                                <option value="shipped" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">🚚 Shipped</option>
                                                <option value="delivered" className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200">✅ Delivered</option>
                                                <option value="cancelled" className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200">❌ Cancelled</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

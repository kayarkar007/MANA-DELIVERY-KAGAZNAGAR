"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, MapPin, ChevronDown, Loader2, RotateCcw, Search, Download, Clock3 } from "lucide-react";
import { toast } from "sonner";
import { getOrderItemSummary, getPrimaryOrderImage } from "@/lib/orderPresentation";

const statusColor: Record<string, string> = {
    delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    shipped: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    processing: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    pending: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
};

const paymentColor: Record<string, string> = {
    verified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    refunded: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    cod_pending: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const refundColor: Record<string, string> = {
    none: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    requested: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    approved: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    rejected: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    processed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [riders, setRiders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("");
    const [refundStatus, setRefundStatus] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const onDutyRiders = riders.filter((rider) => rider.isOnDuty || rider.dutyStatus === "on_duty").length;

    const fetchOrders = async (nextPage = page, nextSearch = search) => {
        setLoading(true);
        let lastError = "Failed to fetch orders";

        for (const delayMs of [0, 800]) {
            if (delayMs) {
                await new Promise((resolve) => window.setTimeout(resolve, delayMs));
            }

            try {
                const params = new URLSearchParams({
                    page: String(nextPage),
                    limit: "10",
                });
                if (nextSearch.trim()) params.set("search", nextSearch.trim());
                if (status) params.set("status", status);
                if (paymentStatus) params.set("paymentStatus", paymentStatus);
                if (refundStatus) params.set("refundStatus", refundStatus);

                const res = await fetch(`/api/orders?${params.toString()}`, { cache: "no-store" });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || "Failed to fetch orders");
                }

                setOrders(data.data || []);
                setTotalPages(data.pagination?.totalPages || 1);
                setLoading(false);
                return true;
            } catch (error: any) {
                lastError = error.message || lastError;
            }
        }

        toast.error(lastError);
        setOrders([]);
        setTotalPages(1);
        setLoading(false);

        return false;
    };

    const fetchRiders = async () => {
        let lastError = "Failed to fetch riders";

        for (const delayMs of [0, 800]) {
            if (delayMs) {
                await new Promise((resolve) => window.setTimeout(resolve, delayMs));
            }

            try {
                const res = await fetch("/api/admin/riders", { cache: "no-store" });
                const data = await res.json();
                if (!res.ok || !data.success) {
                    throw new Error(data.error || "Failed to fetch riders");
                }

                setRiders(data.data || []);
                return true;
            } catch (error: any) {
                lastError = error.message || lastError;
            }
        }

        toast.error(lastError);
        setRiders([]);
        return false;
    };

    useEffect(() => {
        fetchRiders();
    }, []);

    useEffect(() => {
        fetchOrders(page, search);
    }, [page, status, paymentStatus, refundStatus]);

    const counts = useMemo(() => ({
        pending: orders.filter((order) => order.status === "pending").length,
        refundAttention: orders.filter((order) => ["requested", "approved"].includes(order.refundStatus || "none")).length,
        paymentPending: orders.filter((order) => ["pending", "cod_pending"].includes(order.paymentStatus || "pending")).length,
    }), [orders]);

    const runSearch = async () => {
        setPage(1);
        await fetchOrders(1, search);
    };

    const handleRiderAssign = async (orderId: string, riderId: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ riderId }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(riderId ? "Rider assigned" : "Rider unassigned");
                fetchOrders(page, search);
                if (data.riderWhatsappUrl) {
                    window.open(data.riderWhatsappUrl, "_blank");
                }
            } else {
                toast.error(data.error || "Failed to update rider");
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const handleStatusUpdate = async (orderId: string, nextStatus: string) => {
        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Order status updated");
                fetchOrders(page, search);
                if (data.whatsappRedirectUrl) {
                    window.open(data.whatsappRedirectUrl, "_blank");
                }
            } else {
                toast.error(data.error || "Failed to update order");
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRefundUpdate = async (orderId: string, nextRefundStatus: string, currentReason?: string) => {
        const needsReason = ["requested", "approved", "rejected"].includes(nextRefundStatus);
        const refundReason = needsReason
            ? window.prompt("Refund note / reason", currentReason || "") || currentReason || ""
            : currentReason || "";

        setUpdatingId(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refundStatus: nextRefundStatus, refundReason }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Refund status updated");
                fetchOrders(page, search);
            } else {
                toast.error(data.error || "Failed to update refund");
            }
        } finally {
            setUpdatingId(null);
        }
    };

    const exportCsv = () => {
        const rows = [
            ["Order ID", "Customer", "Phone", "Status", "Payment Status", "Refund Status", "Total", "Payment Method", "Created At"],
            ...orders.map((order) => [
                order._id,
                order.customerName,
                order.customerPhone,
                order.status,
                order.paymentStatus || "pending",
                order.refundStatus || "none",
                order.total,
                order.paymentMethod || "cod",
                new Date(order.createdAt).toISOString(),
            ]),
        ];

        const csv = rows
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "orders-export.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Manage Orders</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Track dispatch, payments, refunds, and customer history from one place.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={exportCsv} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-bold inline-flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button onClick={() => fetchOrders(page, search)} className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-400">Orders On Page</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{orders.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-orange-500">Pending Orders</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{counts.pending}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-emerald-500">Riders On Duty</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{onDutyRiders}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-widest text-red-500">Refund Attention</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white mt-3">{counts.refundAttention}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border dark:border-gray-800 shadow-sm space-y-4">
                <div className="grid gap-3 md:grid-cols-5">
                    <div className="relative md:col-span-2">
                        <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by customer, phone, txn, promo, address"
                            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                        />
                    </div>
                    <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold">
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <select value={paymentStatus} onChange={(e) => { setPage(1); setPaymentStatus(e.target.value); }} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold">
                        <option value="">All Payments</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="refunded">Refunded</option>
                        <option value="failed">Failed</option>
                        <option value="cod_pending">COD Pending</option>
                    </select>
                    <select value={refundStatus} onChange={(e) => { setPage(1); setRefundStatus(e.target.value); }} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold">
                        <option value="">All Refunds</option>
                        <option value="none">None</option>
                        <option value="requested">Requested</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="processed">Processed</option>
                    </select>
                </div>
                <div className="flex justify-end">
                    <button onClick={runSearch} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700">
                        Search
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-16">
                    <Loader2 className="w-8 h-8 animate-spin text-red-600 dark:text-red-400" />
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-12 text-center border dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    No orders found.
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => {
                        const image = getPrimaryOrderImage(order);
                        const refundState = order.refundStatus || "none";
                        const paymentState = order.paymentStatus || "pending";
                        const history = Array.isArray(order.statusHistory) ? [...order.statusHistory].reverse() : [];
                        const shortId = order._id.slice(-6).toUpperCase();

                        return (
                            <div key={order._id} className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 space-y-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-black text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-2.5 py-1 rounded-lg">
                                                #{shortId}
                                            </span>
                                            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${statusColor[order.status] || statusColor.pending}`}>
                                                {order.status}
                                            </span>
                                            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${paymentColor[paymentState] || paymentColor.pending}`}>
                                                Payment {paymentState.replace(/_/g, " ")}
                                            </span>
                                            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-lg ${refundColor[refundState] || refundColor.none}`}>
                                                Refund {refundState.replace(/_/g, " ")}
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex-shrink-0">
                                                {image ? (
                                                    <img src={image} alt={getOrderItemSummary(order)} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[10px] font-black uppercase text-red-500">
                                                        {order.type === "service" ? "Service" : "Order"}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-black text-gray-900 dark:text-white">{getOrderItemSummary(order)}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{order.customerName} • {order.customerPhone}</p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-left sm:text-right space-y-2">
                                        <p className="text-2xl font-black text-gray-900 dark:text-white">Rs {Number(order.total).toFixed(2)}</p>
                                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">
                                            {String(order.paymentMethod || "cod").toUpperCase()}
                                            {order.transactionId ? ` • ${order.transactionId}` : ""}
                                        </p>
                                        {order.refundReason && (
                                            <p className="text-xs text-rose-500 font-bold max-w-xs sm:max-w-sm">{order.refundReason}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-4">
                                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Assign Rider</p>
                                        <div className="relative">
                                            <select
                                                value={order.riderId || ""}
                                                onChange={(e) => handleRiderAssign(order._id, e.target.value)}
                                                disabled={updatingId === order._id || ["delivered", "cancelled"].includes(order.status)}
                                                className="appearance-none w-full border border-gray-200 dark:border-gray-700 font-bold text-sm px-4 py-3 rounded-xl cursor-pointer outline-none disabled:opacity-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                            >
                                                <option value="">Unassigned</option>
                                                {riders.map((rider) => (
                                                    <option key={rider._id} value={rider._id}>
                                                        {rider.name} {(rider.isOnDuty || rider.dutyStatus === "on_duty") ? "- On Duty" : "- Off Duty"}
                                                    </option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                        {order.deliveryStatus && (
                                            <p className="text-[10px] font-black uppercase text-red-600 mt-2">
                                                Delivery: {order.deliveryStatus.replace(/_/g, " ")}
                                            </p>
                                        )}
                                    </div>

                                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Order Status</p>
                                        <div className="relative">
                                            <select
                                                value={order.status}
                                                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                                disabled={updatingId === order._id}
                                                className="appearance-none w-full border border-gray-200 dark:border-gray-700 font-bold text-sm px-4 py-3 rounded-xl cursor-pointer outline-none disabled:opacity-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="processing">Processing</option>
                                                <option value="shipped">Shipped</option>
                                                <option value="delivered">Delivered</option>
                                                <option value="cancelled">Cancelled</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Refund Workflow</p>
                                        <div className="relative">
                                            <select
                                                value={refundState}
                                                onChange={(e) => handleRefundUpdate(order._id, e.target.value, order.refundReason)}
                                                disabled={updatingId === order._id}
                                                className="appearance-none w-full border border-gray-200 dark:border-gray-700 font-bold text-sm px-4 py-3 rounded-xl cursor-pointer outline-none disabled:opacity-50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                            >
                                                <option value="none">None</option>
                                                <option value="requested">Requested</option>
                                                <option value="approved">Approved</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="processed">Processed</option>
                                            </select>
                                            <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>
                                    </div>

                                    <div className="rounded-2xl bg-gray-50 dark:bg-gray-800/70 p-4 flex flex-col justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Address</p>
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-3">{order.address}</p>
                                        </div>
                                        <a
                                            href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                                            target="_blank"
                                            className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-red-600 dark:text-red-400"
                                        >
                                            <MapPin className="w-4 h-4" /> Open Map
                                        </a>
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-between items-center gap-3">
                                    <button
                                        onClick={() => setExpandedId((prev) => prev === order._id ? null : order._id)}
                                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300"
                                    >
                                        <Clock3 className="w-4 h-4" /> {expandedId === order._id ? "Hide timeline" : "Show timeline"}
                                    </button>
                                    {updatingId === order._id && (
                                        <div className="inline-flex items-center gap-2 text-sm font-bold text-red-600">
                                            <Loader2 className="w-4 h-4 animate-spin" /> Updating...
                                        </div>
                                    )}
                                </div>

                                {expandedId === order._id && (
                                    <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 p-4 space-y-4">
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Tip</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">Rs {Number(order.tipAmount || 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Wallet Used</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">Rs {Number(order.walletUsed || 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Promo</p>
                                                <p className="text-sm font-bold text-gray-900 dark:text-white">{order.promoCode || "None"}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {history.length === 0 ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400">No status timeline available.</p>
                                            ) : (
                                                history.map((entry: any, index: number) => (
                                                    <div key={`${entry.at}-${index}`} className="flex gap-3">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-black text-gray-900 dark:text-white">{entry.label}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {new Date(entry.at).toLocaleString("en-IN")}
                                                                {entry.actorRole ? ` • ${entry.actorRole}` : ""}
                                                            </p>
                                                            {entry.note && (
                                                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{entry.note}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold disabled:opacity-50">
                            Prev
                        </button>
                        <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Page {page} / {totalPages}</span>
                        <button onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages} className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm font-bold disabled:opacity-50">
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import {
    AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { BarChart3, Loader2, PieChart as PieChartIcon, TrendingUp, Users, ShoppingBag, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
    Pending: "#f59e0b",
    Processing: "#3b82f6",
    Shipped: "#10b981",
    Delivered: "#22c55e",
    Cancelled: "#ef4444",
};

export default function AdminAnalyticsCharts() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then((res) => res.json())
            .then((res) => {
                if (res.success) setData(res.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <section className="grid gap-5 lg:grid-cols-2">
                {[0, 1].map((i) => (
                    <div key={i} className="app-card flex h-80 items-center justify-center rounded-[2rem]">
                        <Loader2 className="h-6 w-6 animate-spin text-red-500" />
                    </div>
                ))}
            </section>
        );
    }

    if (!data) return null;

    return (
        <>
            {/* Today's Quick Stats */}
            {data.today && (
                <section className="grid gap-4 sm:grid-cols-3">
                    {[
                        {
                            label: "Today's Orders",
                            value: data.today.orders,
                            icon: ShoppingBag,
                            color: "text-amber-600",
                            bg: "bg-amber-500/10",
                        },
                        {
                            label: "Today's Revenue",
                            value: formatCurrency(data.today.revenue),
                            icon: TrendingUp,
                            color: "text-emerald-600",
                            bg: "bg-emerald-500/10",
                        },
                        {
                            label: "New Users Today",
                            value: data.today.newUsers,
                            icon: Users,
                            color: "text-sky-600",
                            bg: "bg-sky-500/10",
                        },
                    ].map((stat) => (
                        <div key={stat.label} className="app-card flex items-center gap-4 rounded-[1.8rem] p-5">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg}`}>
                                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
                                <p className={`mt-1 text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* Charts */}
            <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
                {/* Revenue Area Chart */}
                <div className="app-card rounded-[2rem] p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
                            <BarChart3 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">7-day trend</p>
                            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Revenue & Orders</h2>
                        </div>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={data.revenueChart}>
                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#c62828" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#c62828" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,100,100,0.1)" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 11, fontWeight: 800, fill: "#94a3b8" }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fontWeight: 800, fill: "#94a3b8" }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `₹${v}`}
                                />
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(15,5,8,0.95)",
                                        border: "1px solid rgba(214,160,70,0.2)",
                                        borderRadius: "1rem",
                                        color: "#fff",
                                        fontSize: 12,
                                        fontWeight: 800,
                                    }}
                                    formatter={(value: any, name: any) => [
                                        name === "revenue" ? formatCurrency(Number(value)) : value,
                                        name === "revenue" ? "Revenue" : "Orders",
                                    ]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#c62828"
                                    strokeWidth={2.5}
                                    fill="url(#revenueGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status Pie Chart */}
                <div className="app-card rounded-[2rem] p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10">
                            <PieChartIcon className="h-5 w-5 text-violet-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Distribution</p>
                            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Order Status</h2>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <PieChart>
                                <Pie
                                    data={data.statusPie}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {data.statusPie.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || "#64748b"} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: "rgba(15,5,8,0.95)",
                                        border: "1px solid rgba(214,160,70,0.2)",
                                        borderRadius: "1rem",
                                        color: "#fff",
                                        fontSize: 12,
                                        fontWeight: 800,
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap justify-center gap-3">
                        {data.statusPie.map((entry: any) => (
                            <div key={entry.name} className="flex items-center gap-1.5">
                                <div
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ background: STATUS_COLORS[entry.name] || "#64748b" }}
                                />
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                    {entry.name} ({entry.value})
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Recent Activity Feed */}
            {data.recentOrders && data.recentOrders.length > 0 && (
                <section className="app-card rounded-[2rem] p-6 sm:p-8">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10">
                            <Clock className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Activity</p>
                            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Recent Orders</h2>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {data.recentOrders.map((order: any) => {
                            const statusColor =
                                order.status === "delivered" ? "text-emerald-600 bg-emerald-500/10" :
                                order.status === "cancelled" ? "text-rose-600 bg-rose-500/10" :
                                order.status === "shipped" ? "text-sky-600 bg-sky-500/10" :
                                "text-amber-600 bg-amber-500/10";
                            const itemCount = order.items?.length || 0;
                            const orderName = order.customerName || "Customer";

                            return (
                                <div
                                    key={order._id}
                                    className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-slate-200/80 bg-white/80 p-4 dark:border-slate-800/90 dark:bg-slate-950/70"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${statusColor}`}>
                                            <ShoppingBag className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                                                {orderName}
                                            </p>
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
                                                #{order._id.slice(-6).toUpperCase()} · {itemCount} items · {order.paymentMethod || "cod"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                        <span className="text-sm font-black text-slate-900 dark:text-white">
                                            {formatCurrency(order.total || 0)}
                                        </span>
                                        <span className={`rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${statusColor}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </>
    );
}

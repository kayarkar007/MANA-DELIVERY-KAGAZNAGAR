"use client";

import { useEffect, useState } from "react";
import { Loader2, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from "recharts";

const COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];

type RevenuePoint = { date: string; revenue: number };
type StatusPiePoint = { name: string; value: number };
type AnalyticsData = { revenueChart: RevenuePoint[]; statusPie: StatusPiePoint[] };

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then(res => res.json())
            .then(res => {
                if (res.success) setData(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[200px] sm:min-h-[240px] items-center justify-center">
                <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-red-600" />
            </div>
        );
    }

    if (!data) return <div className="p-4 sm:p-6 md:p-10 text-center text-gray-500 text-sm sm:text-base">Failed to load analytics</div>;

    return (
        <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white flex items-center gap-2 sm:gap-4">
                <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 shrink-0" />
                Store Analytics
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                {/* Revenue Chart — mobile first */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-gray-200">7-Day Revenue</h2>
                    <div className="h-56 sm:h-64 md:h-72 lg:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <Tooltip
                                    formatter={(value) => [`₹${Number(value ?? 0)}`, 'Revenue']}
                                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Orders Pie Chart — mobile first */}
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h2 className="text-base sm:text-lg md:text-xl font-bold mb-4 sm:mb-6 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 shrink-0" /> Order Status Distribution
                    </h2>
                    {data.statusPie.length === 0 ? (
                        <div className="h-56 sm:h-64 md:h-72 lg:h-80 flex items-center justify-center text-gray-400 dark:text-gray-500 font-medium text-sm sm:text-base">No orders in the last 7 days</div>
                    ) : (
                        <div className="h-56 sm:h-64 md:h-72 lg:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data.statusPie}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {data.statusPie.map((entry: StatusPiePoint, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

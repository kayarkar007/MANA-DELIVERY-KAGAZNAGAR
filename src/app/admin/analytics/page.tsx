"use client";

import { useEffect, useState } from "react";
import { Loader2, PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

const COLORS = ["#e13a32", "#d6a046", "#7b0f13", "#f6d49b", "#ff8f76"];
const TOOLTIP_STYLE = {
    borderRadius: "1rem",
    border: "1px solid rgba(214,160,70,0.14)",
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.35)",
    backgroundColor: "#14080b",
    color: "#fff4ec",
};

type RevenuePoint = { date: string; revenue: number };
type StatusPiePoint = { name: string; value: number };
type AnalyticsData = { revenueChart: RevenuePoint[]; statusPie: StatusPiePoint[] };

export default function AdminAnalytics() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);

    useEffect(() => {
        fetch("/api/admin/analytics")
            .then((res) => res.json())
            .then((res) => {
                if (res.success) setData(res.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-[200px] items-center justify-center sm:min-h-[240px]">
                <Loader2 className="h-7 w-7 animate-spin text-red-600 sm:h-8 sm:w-8" />
            </div>
        );
    }

    if (!data) {
        return <div className="p-4 text-center text-sm text-stone-400 sm:p-6 sm:text-base md:p-10">Failed to load analytics</div>;
    }

    return (
        <div className="animate-in space-y-4 fade-in sm:space-y-6 md:space-y-8">
            <h1 className="flex items-center gap-2 text-xl font-black text-white sm:gap-4 sm:text-2xl md:text-3xl">
                <TrendingUp className="h-6 w-6 shrink-0 text-red-500 sm:h-8 sm:w-8" />
                Store Analytics
            </h1>

            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-2">
                <div className="app-card rounded-2xl p-4 sm:rounded-3xl sm:p-5 md:p-6">
                    <h2 className="mb-4 text-base font-bold text-stone-100 sm:mb-6 sm:text-lg md:text-xl">7-Day Revenue</h2>
                    <div className="h-56 w-full sm:h-64 md:h-72 lg:h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e13a32" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#e13a32" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" stroke="#bfa39b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis
                                    stroke="#bfa39b"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `Rs ${value}`}
                                />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(214,160,70,0.12)" />
                                <Tooltip
                                    formatter={(value) => [`Rs ${Number(value ?? 0)}`, "Revenue"]}
                                    contentStyle={TOOLTIP_STYLE}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#e13a32" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="app-card rounded-2xl p-4 sm:rounded-3xl sm:p-5 md:p-6">
                    <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-stone-100 sm:mb-6 sm:text-lg md:text-xl">
                        <PieChartIcon className="h-4 w-4 shrink-0 text-[#d6a046] sm:h-5 sm:w-5" />
                        Order Status Distribution
                    </h2>
                    {data.statusPie.length === 0 ? (
                        <div className="flex h-56 items-center justify-center text-sm font-medium text-[#bfa39b] sm:h-64 sm:text-base md:h-72 lg:h-80">
                            No orders in the last 7 days
                        </div>
                    ) : (
                        <div className="h-56 w-full sm:h-64 md:h-72 lg:h-80">
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
                                            <Cell key={`cell-${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-xs font-bold tracking-[0.08em] text-[#d6c0b6]">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

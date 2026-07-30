"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { formatCurrency } from "@/lib/utils";
import { IndianRupee, TrendingUp, Calendar, Award, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function RiderEarningsPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompletedOrders = async () => {
            try {
                const res = await fetch("/api/orders?limit=100&status=delivered");
                const data = await res.json();
                if (data.success) {
                    setOrders(data.data || []);
                }
            } catch (err) {
                console.error("Error fetching earnings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompletedOrders();
    }, []);

    // Calculate earnings Breakdown (Base ₹30 per delivery + customer tips)
    const basePayoutPerOrder = 30;
    const totalDeliveries = orders.length;
    const totalBaseEarnings = totalDeliveries * basePayoutPerOrder;
    const totalTips = orders.reduce((sum, o) => sum + (Number(o.tipAmount) || 0), 0);
    const totalEarnings = totalBaseEarnings + totalTips;

    // Filter Today's earnings
    const todayStr = new Date().toISOString().split("T")[0];
    const todayOrders = orders.filter((o) => new Date(o.createdAt).toISOString().split("T")[0] === todayStr);
    const todayBase = todayOrders.length * basePayoutPerOrder;
    const todayTips = todayOrders.reduce((sum, o) => sum + (Number(o.tipAmount) || 0), 0);
    const todayEarnings = todayBase + todayTips;

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/rider" className="app-button app-button-secondary rounded-2xl p-3">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                        Rider Earnings Dashboard
                    </h1>
                    <p className="text-xs text-slate-500 font-medium">
                        Track your delivery payouts and tips in Kagaznagar.
                    </p>
                </div>
            </div>

            {/* Earnings Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="app-card rounded-[2rem] p-6 border border-emerald-500/20 bg-emerald-500/5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Today's Earnings</p>
                            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {formatCurrency(todayEarnings)}
                            </p>
                        </div>
                    </div>
                    <p className="mt-3 text-[11px] font-bold text-slate-500">
                        {todayOrders.length} deliveries completed today
                    </p>
                </div>

                <div className="app-card rounded-[2rem] p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Award className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Customer Tips</p>
                            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                                {formatCurrency(totalTips)}
                            </p>
                        </div>
                    </div>
                    <p className="mt-3 text-[11px] font-bold text-slate-500">
                        100% tips passed to you
                    </p>
                </div>

                <div className="app-card rounded-[2rem] p-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400">
                            <IndianRupee className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Lifetime Payout</p>
                            <p className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                                {formatCurrency(totalEarnings)}
                            </p>
                        </div>
                    </div>
                    <p className="mt-3 text-[11px] font-bold text-slate-500">
                        {totalDeliveries} total deliveries
                    </p>
                </div>
            </div>

            {/* Delivery Earnings History List */}
            <div className="app-card rounded-[2rem] p-6">
                <h2 className="text-lg font-black text-slate-900 dark:text-white mb-4">
                    Completed Deliveries & Payouts
                </h2>

                {orders.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm font-medium">
                        No completed deliveries yet. Accept orders on your dashboard to start earning!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => {
                            const tip = Number(order.tipAmount) || 0;
                            const payout = basePayoutPerOrder + tip;
                            return (
                                <div
                                    key={order._id}
                                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-slate-800/80 dark:bg-slate-950/50"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                                            <CheckCircle2 className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-black text-slate-900 dark:text-white">
                                                Order #{order._id.slice(-6).toUpperCase()}
                                            </p>
                                            <p className="text-[10px] font-bold text-slate-400">
                                                {new Date(order.createdAt).toLocaleString("en-IN", {
                                                    day: "numeric",
                                                    month: "short",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                                {tip > 0 && <span className="ml-2 text-amber-500 font-bold"> Includes {formatCurrency(tip)} Tip</span>}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                            +{formatCurrency(payout)}
                                        </p>
                                        <p className="text-[9px] font-black uppercase text-slate-400">Base ₹30 + Tip ₹{tip}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

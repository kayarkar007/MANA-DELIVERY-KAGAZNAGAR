import Link from "next/link";
import { ArrowRight, LayoutDashboard, Navigation, Users } from "lucide-react";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Category from "@/models/Category";
import User from "@/models/User";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getStats() {
    await connectToDatabase();

    const [productsCount, categoriesCount, usersCount, ordersCount, revenueAgg, statusAgg] = await Promise.all([
        Product.countDocuments(),
        Category.countDocuments(),
        User.countDocuments(),
        Order.countDocuments(),
        Order.aggregate([
            { $match: { status: "delivered" } },
            { $group: { _id: null, totalRevenue: { $sum: "$total" } } },
        ]),
        Order.aggregate([
            { $match: { status: { $in: ["pending", "processing", "shipped"] } } },
            { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
    ]);

    const statusCounts = Object.fromEntries(statusAgg.map((entry) => [entry._id, entry.count])) as Record<string, number>;

    return {
        ordersCount,
        productsCount,
        categoriesCount,
        totalRevenue: revenueAgg[0]?.totalRevenue || 0,
        pendingOrders: statusCounts.pending || 0,
        processingOrders: statusCounts.processing || 0,
        shippedOrders: statusCounts.shipped || 0,
        usersCount,
    };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-8 sm:space-y-10">
            <section className="app-card-strong overflow-hidden px-6 py-7 sm:px-8 sm:py-9">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-4">
                        <span className="app-kicker">Operations overview</span>
                        <h1 className="app-title flex items-center gap-3 text-4xl text-slate-900 dark:text-white sm:text-5xl">
                            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-300">
                                <LayoutDashboard className="h-6 w-6" />
                            </span>
                            Admin Dashboard
                        </h1>
                        <p className="app-subtitle max-w-2xl">
                            Faster at-a-glance operations with cleaner hierarchy, less noise, and stats computed more efficiently on the backend.
                        </p>
                    </div>

                    <div className="rounded-[1.8rem] border border-[rgba(214,160,70,0.14)] bg-[linear-gradient(135deg,#120507,#26090d_45%,#6d1016_80%,#d6a046_118%)] p-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.36)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/65">Delivered revenue</p>
                        <p className="mt-3 font-display text-4xl font-black">{formatCurrency(stats.totalRevenue)}</p>
                        <p className="mt-2 text-sm text-white/70">Calculated from delivered orders only.</p>
                    </div>
                </div>
            </section>

            <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Pending orders", value: stats.pendingOrders, href: "/admin/orders", accent: "text-amber-600" },
                    { label: "Processing", value: stats.processingOrders, href: "/admin/orders", accent: "text-sky-600" },
                    { label: "Shipped", value: stats.shippedOrders, href: "/admin/orders", accent: "text-emerald-600" },
                    { label: "Users", value: stats.usersCount, href: "/admin/users", accent: "text-slate-900 dark:text-white" },
                ].map((card) => (
                    <Link key={card.label} href={card.href} className="app-stat p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{card.label}</p>
                        <p className={`mt-4 text-4xl font-black ${card.accent}`}>{card.value}</p>
                        <div className="mt-6 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-500">
                            Open
                            <ArrowRight className="h-4 w-4" />
                        </div>
                    </Link>
                ))}
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="app-card rounded-[2rem] p-6 sm:p-8">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Store footprint</p>
                            <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Core catalog health</h2>
                        </div>
                        <Link href="/admin/categories" className="app-button app-button-secondary rounded-[1.1rem]">
                            Manage
                        </Link>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {[
                            { label: "Total orders", value: stats.ordersCount },
                            { label: "Products", value: stats.productsCount },
                            { label: "Categories", value: stats.categoriesCount },
                        ].map((item) => (
                            <div key={item.label} className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 p-5 dark:border-slate-800/90 dark:bg-slate-950/70">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                                <p className="mt-4 text-3xl font-black text-slate-900 dark:text-white">{item.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-5">
                    <div className="app-card rounded-[2rem] p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live operations</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Fleet and support</h2>
                        <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                            Jump directly into live tracking, support tickets, or user management without scanning multiple tabs.
                        </p>
                        <div className="mt-6 grid gap-3">
                            <Link href="/admin/live-tracking" className="app-button app-button-primary justify-between rounded-[1.2rem]">
                                Fleet tracking
                                <Navigation className="h-4 w-4" />
                            </Link>
                            <Link href="/admin/users" className="app-button app-button-secondary justify-between rounded-[1.2rem]">
                                User management
                                <Users className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

import { ArrowRight, LayoutDashboard, Navigation, Users } from "lucide-react";
import Link from "next/link";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Category from "@/models/Category";
import User from "@/models/User";

export const dynamic = 'force-dynamic';

async function getStats() {
    await connectToDatabase();
    const productsCount = await Product.countDocuments();
    const categoriesCount = await Category.countDocuments();

    // Fetch all orders to calculate detailed stats
    const allOrders = await Order.find({});
    const ordersCount = allOrders.length;

    // Calculate total revenue (only from delivered orders)
    const totalRevenue = allOrders
        .filter(order => order.status === "delivered")
        .reduce((sum, order) => sum + (order.total || 0), 0);

    // Count by statuses
    const pendingOrders = allOrders.filter(o => o.status === "pending").length;
    const processingOrders = allOrders.filter(o => o.status === "processing").length;
    const shippedOrders = allOrders.filter(o => o.status === "shipped").length;

    const usersCount = await User.countDocuments();

    return {
        ordersCount,
        productsCount,
        categoriesCount,
        totalRevenue,
        pendingOrders,
        processingOrders,
        shippedOrders,
        usersCount,
    };
}

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-2xl">
                        <LayoutDashboard className="w-8 h-8" />
                    </div>
                    Admin Dashboard
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-2">
                    Manage your super app seamlessly. Here's what's happening today.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-6 rounded-3xl border border-blue-800 shadow-md flex flex-col justify-between col-span-1 md:col-span-2 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-200 font-bold uppercase tracking-widest text-sm mb-2">Total Revenue Generated</p>
                        <h2 className="text-5xl font-black">₹{stats.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</h2>
                        <p className="text-blue-300 text-sm mt-2">From delivered orders only</p>
                    </div>
                    <Link
                        href="/admin/analytics"
                        className="relative z-10 mt-6 flex items-center justify-between text-white font-bold hover:text-blue-200 transition-colors bg-white/10 px-4 py-3 rounded-xl border border-white/20 hover:bg-white/20 w-fit gap-4 backdrop-blur-sm"
                    >
                        View Analytics <ArrowRight className="w-5 h-5" />
                    </Link>
                    <div className="absolute right-0 bottom-0 text-white/5 transform translate-x-1/4 translate-y-1/4">
                        <LayoutDashboard className="w-64 h-64" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Pending Orders</p>
                        <h2 className="text-5xl font-black text-orange-500">{stats.pendingOrders}</h2>
                    </div>
                    <Link
                        href="/admin/orders"
                        className="mt-6 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        Action Required <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Total Orders</p>
                        <h2 className="text-5xl font-black text-gray-900 dark:text-gray-100">{stats.ordersCount}</h2>
                    </div>
                    <Link
                        href="/admin/orders"
                        className="mt-6 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        View All <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Total Categories</p>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100">{stats.categoriesCount}</h2>
                    </div>
                    <Link
                        href="/admin/categories"
                        className="mt-6 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        Manage <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Fleet Management</p>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100">Live Map</h2>
                    </div>
                    <Link
                        href="/admin/live-tracking"
                        className="relative z-10 mt-6 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        Monitor <ArrowRight className="w-5 h-5" />
                    </Link>
                    <div className="absolute right-0 bottom-0 text-gray-50 dark:text-gray-800/20 transform translate-x-1/4 translate-y-1/4 z-0">
                        <Navigation className="w-32 h-32 text-blue-50 dark:text-blue-900/10" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Total Products</p>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100">{stats.productsCount}</h2>
                    </div>
                    <Link
                        href="/admin/products"
                        className="mt-6 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        Manage <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Promo Codes</p>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100">Coupons</h2>
                    </div>
                    <Link
                        href="/admin/promo"
                        className="mt-6 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        Manage <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">Registered Users</p>
                        <h2 className="text-4xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Users className="w-8 h-8 text-blue-500" /> {stats.usersCount}
                        </h2>
                    </div>
                    <Link
                        href="/admin/users"
                        className="mt-6 flex items-center justify-between text-blue-600 dark:text-blue-400 font-bold hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                    >
                        Manage <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

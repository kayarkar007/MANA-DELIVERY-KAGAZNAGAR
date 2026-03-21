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
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                    <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-2xl">
                        <LayoutDashboard className="w-6 h-6 sm:w-8 sm:h-8" />
                    </div>
                    Admin Dashboard
                </h1>
                <p className="text-sm sm:text-lg text-gray-500 dark:text-gray-400 font-medium pl-1 sm:pl-2">
                    Manage your super app seamlessly. Here's what's happening today.
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {/* Revenue Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-red-900 text-white p-5 sm:p-6 rounded-3xl border border-red-800 shadow-md flex flex-col justify-between col-span-2 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-red-200 font-bold uppercase tracking-widest text-xs mb-2">Total Revenue Generated</p>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black">₹{stats.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</h2>
                        <p className="text-red-300 text-sm mt-2">From delivered orders only</p>
                    </div>
                    <Link
                        href="/admin/analytics"
                        className="relative z-10 mt-6 flex items-center justify-between text-white font-bold hover:text-red-200 transition-colors bg-white/10 px-4 py-3 rounded-xl border border-white/20 hover:bg-white/20 w-fit gap-4 backdrop-blur-sm text-sm"
                    >
                        View Analytics <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="absolute right-0 bottom-0 text-white/5 transform translate-x-1/4 translate-y-1/4">
                        <LayoutDashboard className="w-48 h-48 sm:w-64 sm:h-64" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Pending Orders</p>
                        <h2 className="text-3xl sm:text-5xl font-black text-orange-500">{stats.pendingOrders}</h2>
                    </div>
                    <Link href="/admin/orders" className="mt-4 sm:mt-6 flex items-center justify-between text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-300 transition-colors text-sm">
                        Action Required <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Orders</p>
                        <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-gray-100">{stats.ordersCount}</h2>
                    </div>
                    <Link href="/admin/orders" className="mt-4 sm:mt-6 flex items-center justify-between text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-300 transition-colors text-sm">
                        View All <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Categories</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{stats.categoriesCount}</h2>
                    </div>
                    <Link href="/admin/categories" className="mt-4 sm:mt-6 flex items-center justify-between text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-300 transition-colors text-sm">
                        Manage <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Fleet Management</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100">Live Map</h2>
                    </div>
                    <Link href="/admin/live-tracking" className="relative z-10 mt-4 sm:mt-6 flex items-center justify-between text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-300 transition-colors text-sm">
                        Monitor <ArrowRight className="w-4 h-4" />
                    </Link>
                    <div className="absolute right-0 bottom-0 text-red-50 dark:text-red-900/10 transform translate-x-1/4 translate-y-1/4 z-0">
                        <Navigation className="w-24 h-24 sm:w-32 sm:h-32" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Total Products</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">{stats.productsCount}</h2>
                    </div>
                    <Link href="/admin/products" className="mt-4 sm:mt-6 flex items-center justify-between text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-300 transition-colors text-sm">
                        Manage <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Promo Codes</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100">Coupons</h2>
                    </div>
                    <Link href="/admin/promo" className="mt-4 sm:mt-6 flex items-center justify-between text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-300 transition-colors text-sm">
                        Manage <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-3xl border dark:border-gray-800 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs mb-2">Registered Users</p>
                        <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <Users className="w-7 h-7 text-red-500" /> {stats.usersCount}
                        </h2>
                    </div>
                    <Link href="/admin/users" className="mt-4 sm:mt-6 flex items-center justify-between text-red-600 dark:text-red-400 font-bold hover:text-red-800 dark:hover:text-red-300 transition-colors text-sm">
                        Manage <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

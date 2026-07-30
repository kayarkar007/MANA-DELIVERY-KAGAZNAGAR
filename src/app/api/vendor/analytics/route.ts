import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { requireVendor } from "@/lib/routeAuth";

/** GET /api/vendor/analytics — Vendor's sales analytics */
export async function GET() {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const shopIdStr = session.user.shopId?.toString();

        if (!shopIdStr) {
            return NextResponse.json({
                success: true,
                data: { today: { orders: 0, revenue: 0 }, week: { orders: 0, revenue: 0 }, topProducts: [], recentOrders: [] }
            });
        }

        await connectToDatabase();

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        // All orders for vendor's shop
        const allOrders = await Order.find({
            "items.shop.shopId": shopIdStr,
            status: { $ne: "cancelled" },
        }).lean();

        const todayOrders = allOrders.filter((o: any) => new Date(o.createdAt) >= todayStart);
        const weekOrders = allOrders.filter((o: any) => new Date(o.createdAt) >= sevenDaysAgo);

        // Revenue calculation (only items from this shop)
        function calcRevenue(orders: any[]) {
            return orders.reduce((total: number, order: any) => {
                const shopItems = (order.items || []).filter((item: any) => item.shop?.shopId === shopIdStr);
                return total + shopItems.reduce((s: number, item: any) => s + (item.price * item.quantity), 0);
            }, 0);
        }

        // Top 5 products by quantity sold
        const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
        allOrders.forEach((order: any) => {
            (order.items || []).forEach((item: any) => {
                if (item.shop?.shopId === shopIdStr) {
                    if (!productSales[item.productId]) {
                        productSales[item.productId] = { name: item.name, qty: 0, revenue: 0 };
                    }
                    productSales[item.productId].qty += item.quantity;
                    productSales[item.productId].revenue += item.price * item.quantity;
                }
            });
        });

        const topProducts = Object.entries(productSales)
            .sort(([, a], [, b]) => b.qty - a.qty)
            .slice(0, 5)
            .map(([productId, data]) => ({ productId, ...data }));

        // Recent 10 orders
        const recentOrders = allOrders
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 10)
            .map((o: any) => ({
                _id: o._id,
                status: o.status,
                total: o.total,
                customerName: o.customerName,
                createdAt: o.createdAt,
            }));

        // Low stock products
        const lowStockProducts = await Product.find({
            shopId: shopIdStr,
            $expr: { $lte: ["$stockQuantity", "$lowStockThreshold"] },
            inStock: true,
        }).select("name stockQuantity lowStockThreshold").lean();

        return NextResponse.json({
            success: true,
            data: {
                today: {
                    orders: todayOrders.length,
                    revenue: calcRevenue(todayOrders),
                },
                week: {
                    orders: weekOrders.length,
                    revenue: calcRevenue(weekOrders),
                },
                allTime: {
                    orders: allOrders.length,
                    revenue: calcRevenue(allOrders),
                },
                topProducts,
                recentOrders,
                lowStockProducts,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

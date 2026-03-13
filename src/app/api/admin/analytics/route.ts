import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/routeAuth";

export async function GET(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const orders = await Order.find({ createdAt: { $gte: sevenDaysAgo } }).lean();

        const revenueByDate: Record<string, number> = {};
        const statusDistribution: Record<string, number> = {
            "pending": 0, "processing": 0, "shipped": 0, "delivered": 0, "cancelled": 0
        };

        orders.forEach((order: any) => {
            if (statusDistribution[order.status] !== undefined) {
                statusDistribution[order.status]++;
            }

            if (order.status === "delivered" || order.status === "shipped" || order.status === "processing") {
                const dateKey = new Date(order.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
                revenueByDate[dateKey] = (revenueByDate[dateKey] || 0) + (order.total || 0);
            }
        });

        const chartData = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString("en-US", { month: 'short', day: 'numeric' });
            chartData.push({
                date: dateStr,
                revenue: revenueByDate[dateStr] || 0
            });
        }

        const pieData = Object.entries(statusDistribution).map(([key, value]) => ({
            name: key.charAt(0).toUpperCase() + key.slice(1),
            value
        })).filter(item => item.value > 0);

        return NextResponse.json({
            success: true,
            data: {
                revenueChart: chartData,
                statusPie: pieData
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

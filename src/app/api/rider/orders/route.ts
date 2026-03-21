import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "rider") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const includeStats = searchParams.get("stats") === "true";

        let orders;
        const stats = { completedToday: 0, earningsToday: 0, totalEarnings: 0, totalCompleted: 0 };

        if (includeStats) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const allDeliveredOrders = await Order.find({
                riderId: session.user.id,
                deliveryStatus: "delivered"
            });
            
            stats.totalCompleted = allDeliveredOrders.length;
            stats.totalEarnings = allDeliveredOrders.reduce((acc, order) => acc + (order.deliveryFee || 0) + (order.tipAmount || 0), 0);

            const todayOrders = allDeliveredOrders.filter(o => new Date(o.updatedAt) >= startOfDay);
            stats.completedToday = todayOrders.length;
            stats.earningsToday = todayOrders.reduce((acc, order) => acc + (order.deliveryFee || 0) + (order.tipAmount || 0), 0);
        }

        orders = await Order.find({
            riderId: session.user.id,
            deliveryStatus: { $ne: "delivered" }
        }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: orders, stats });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "rider") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, deliveryStatus, estimatedDeliveryTime, deliveryOtp } = await req.json();

        await connectToDatabase();

        if (deliveryStatus === "delivered") {
            const orderToVerify = await Order.findOne({ _id: orderId, riderId: session.user.id });
            if (!orderToVerify) return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
            
            if (orderToVerify.deliveryOtp && orderToVerify.deliveryOtp !== deliveryOtp) {
                return NextResponse.json({ success: false, error: "Invalid Delivery PIN. Ask customer for the 4-digit code." }, { status: 400 });
            }
        }

        const updateData: any = { deliveryStatus };
        if (estimatedDeliveryTime) {
            updateData.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
        }

        const order = await Order.findOneAndUpdate(
            { _id: orderId, riderId: session.user.id },
            updateData,
            { new: true }
        );

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found or not assigned to you" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

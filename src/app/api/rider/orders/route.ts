import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import { hydrateOrderItemImages } from "@/lib/orderData";
import { getMappedOrderStatus } from "@/lib/orderPresentation";
import Order from "@/models/Order";

const allowedTransitions: Record<string, string[]> = {
    assigned: ["accepted", "declined"],
    accepted: ["picked_up"],
    picked_up: ["out_for_delivery"],
    out_for_delivery: ["delivered"],
};

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "rider") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const includeStats = searchParams.get("stats") === "true";

        const stats = { completedToday: 0, earningsToday: 0, totalEarnings: 0, totalCompleted: 0 };

        if (includeStats) {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const allDeliveredOrders = await Order.find({
                riderId: session.user.id,
                deliveryStatus: "delivered",
            });

            stats.totalCompleted = allDeliveredOrders.length;
            stats.totalEarnings = allDeliveredOrders.reduce(
                (acc, order) => acc + (order.deliveryFee || 0) + (order.tipAmount || 0),
                0
            );

            const todayOrders = allDeliveredOrders.filter(
                (order) => new Date(order.updatedAt) >= startOfDay
            );
            stats.completedToday = todayOrders.length;
            stats.earningsToday = todayOrders.reduce(
                (acc, order) => acc + (order.deliveryFee || 0) + (order.tipAmount || 0),
                0
            );
        }

        const orders = await Order.find({
            riderId: session.user.id,
            deliveryStatus: { $nin: ["delivered", "cancelled"] },
        }).sort({ createdAt: -1 });

        const hydratedOrders = await hydrateOrderItemImages(orders);

        return NextResponse.json({ success: true, data: hydratedOrders, stats });
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

        const order = await Order.findOne({ _id: orderId, riderId: session.user.id });
        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found or not assigned to you" }, { status: 404 });
        }

        if (order.deliveryStatus !== deliveryStatus) {
            const allowedNextStates = allowedTransitions[order.deliveryStatus] || [];
            if (!allowedNextStates.includes(deliveryStatus)) {
                return NextResponse.json(
                    { success: false, error: `Cannot move order from ${order.deliveryStatus} to ${deliveryStatus}` },
                    { status: 400 }
                );
            }
        }

        if (deliveryStatus === "delivered" && order.deliveryOtp && order.deliveryOtp !== deliveryOtp) {
            return NextResponse.json(
                { success: false, error: "Invalid Delivery PIN. Ask customer for the 4-digit code." },
                { status: 400 }
            );
        }

        order.deliveryStatus = deliveryStatus;
        order.status = getMappedOrderStatus(deliveryStatus, order.status) as any;

        if (estimatedDeliveryTime) {
            order.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
        }

        await order.save();

        const hydratedOrder = await hydrateOrderItemImages(order);
        return NextResponse.json({ success: true, data: hydratedOrder });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


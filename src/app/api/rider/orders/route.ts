import { NextResponse } from "next/server";
import { requireRider } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import { hydrateOrderItemImages } from "@/lib/orderData";
import { getMappedOrderStatus } from "@/lib/orderPresentation";
import { triggerNotification, notifyAdmins } from "@/lib/notifications";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";
import { canTransitionDeliveryStatus } from "@/lib/orderState";
import { hideDeliveryOtp, isValidDeliveryOtp } from "@/lib/deliveryOtp";
import Order from "@/models/Order";
import RiderShift from "@/models/RiderShift";

export async function GET(req: Request) {
    try {
        const auth = await requireRider();
        if ("response" in auth) return auth.response;
        const { session } = auth;

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

        return NextResponse.json({ success: true, data: hydratedOrders.map((order: any) => hideDeliveryOtp(order)), stats });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const auth = await requireRider();
        if ("response" in auth) return auth.response;
        const { session } = auth;

        const { orderId, deliveryStatus, estimatedDeliveryTime, deliveryOtp } = await req.json();

        await connectToDatabase();

        const order = await Order.findOne({ _id: orderId, riderId: session.user.id })
            .select("+deliveryOtpHash +deliveryOtpExpiresAt +deliveryOtpAttempts");
        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found or not assigned to you" }, { status: 404 });
        }

        const previousDeliveryStatus = order.deliveryStatus;
        const previousStatus = order.status;

        if (order.deliveryStatus !== deliveryStatus) {
            if (!canTransitionDeliveryStatus(order.deliveryStatus, deliveryStatus)) {
                return NextResponse.json(
                    { success: false, error: `Cannot move order from ${order.deliveryStatus} to ${deliveryStatus}` },
                    { status: 400 }
                );
            }
        }

        if (deliveryStatus === "delivered") {
            if (order.deliveryOtpAttempts >= 5) {
                return NextResponse.json({ success: false, error: "Delivery PIN verification is locked. Contact support." }, { status: 429 });
            }

            if (order.deliveryOtpExpiresAt && order.deliveryOtpExpiresAt < new Date()) {
                return NextResponse.json({ success: false, error: "Delivery PIN has expired. Contact support." }, { status: 400 });
            }

            if (!isValidDeliveryOtp(`${deliveryOtp || ""}`, order.deliveryOtpHash, order.deliveryOtp)) {
                order.deliveryOtpAttempts = (order.deliveryOtpAttempts || 0) + 1;
                await order.save();
                return NextResponse.json({ success: false, error: "Invalid Delivery PIN." }, { status: 400 });
            }
        }

        order.deliveryStatus = deliveryStatus;
        order.status = getMappedOrderStatus(deliveryStatus, order.status) as any;
        if (deliveryStatus === "delivered") {
            order.set("deliveryOtp", undefined);
            order.set("deliveryOtpHash", undefined);
            order.set("deliveryOtpExpiresAt", undefined);
        }
        order.statusHistory = [
            ...(order.statusHistory || []),
            buildOrderHistoryEntry({
                status: order.status,
                deliveryStatus,
                label: `Rider marked ${deliveryStatus.replace(/_/g, " ")}`,
                actorRole: "rider",
                actorId: session.user.id,
            }),
        ];

        if (estimatedDeliveryTime) {
            order.estimatedDeliveryTime = new Date(estimatedDeliveryTime);
        }

        await order.save();

        const deliveryStateChanged =
            order.deliveryStatus !== previousDeliveryStatus ||
            order.status !== previousStatus;

        if (deliveryStatus === "delivered") {
            await RiderShift.findOneAndUpdate(
                { riderId: session.user.id, status: { $in: ["active", "on_break"] } },
                {
                    $inc: {
                        completedOrders: 1,
                        earnings: Number(order.deliveryFee || 0) + Number(order.tipAmount || 0),
                    },
                }
            );
        }

        if (deliveryStateChanged && order.userId) {
            await triggerNotification({
                recipientId: order.userId,
                recipientRole: "user",
                title: "Delivery Update",
                message: `Order #${order._id.toString().slice(-6).toUpperCase()} is now ${deliveryStatus.replace(/_/g, " ")}`,
                type: "order",
                href: `/track/${order._id}`,
                metadata: { orderId: order._id.toString() },
            });
        }

        if (deliveryStateChanged) {
            await notifyAdmins({
                title: "Rider Status Update",
                message: `Order #${order._id.toString().slice(-6).toUpperCase()} is now ${deliveryStatus.replace(/_/g, " ")}`,
                type: "order",
                href: "/admin/orders",
                metadata: { orderId: order._id.toString() },
            });
        }

        const hydratedOrder = await hydrateOrderItemImages(order);
        return NextResponse.json({ success: true, data: hideDeliveryOtp(hydratedOrder) });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { requireVendor } from "@/lib/routeAuth";
import { triggerNotification } from "@/lib/notifications";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";

// Allowed status transitions vendors can make
const VENDOR_ALLOWED_TRANSITIONS: Record<string, string[]> = {
    pending: ["processing", "cancelled"],
    processing: ["shipped"],
};

/** GET /api/vendor/orders/[id] — Get single order detail */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const { id } = await params;
        const shopIdStr = session.user.shopId?.toString();

        await connectToDatabase();
        const order = await Order.findOne({
            _id: id,
            "items.shop.shopId": shopIdStr,
        }).lean();

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/** PATCH /api/vendor/orders/[id] — Accept, reject, or update order status */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const { id } = await params;
        const shopIdStr = session.user.shopId?.toString();

        await connectToDatabase();
        const body = await request.json();
        const { status, note } = body;

        if (!status) {
            return NextResponse.json({ success: false, error: "status is required." }, { status: 400 });
        }

        // Ensure order belongs to this vendor's shop
        const order = await Order.findOne({
            _id: id,
            "items.shop.shopId": shopIdStr,
        });

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found or not yours." }, { status: 404 });
        }

        // Validate status transition
        const allowedNext = VENDOR_ALLOWED_TRANSITIONS[order.status] || [];
        if (!allowedNext.includes(status)) {
            return NextResponse.json(
                { success: false, error: `Cannot change order from '${order.status}' to '${status}'.` },
                { status: 400 }
            );
        }

        const previousStatus = order.status;
        order.status = status;
        order.statusHistory = [
            ...(order.statusHistory || []),
            buildOrderHistoryEntry({
                status,
                label: status === "processing" ? "Vendor accepted order" : status === "cancelled" ? "Vendor rejected order" : `Vendor updated to ${status}`,
                note: note?.trim(),
                actorRole: "vendor",
                actorId: session.user.id,
            }),
        ];

        await order.save();

        // Notify customer
        if (order.userId && order.status !== previousStatus) {
            const msgMap: Record<string, string> = {
                processing: "Your order has been accepted by the shop! 🎉",
                cancelled: "Sorry, your order was cancelled by the shop.",
                shipped: "Your order is on its way! 🚚",
            };
            await triggerNotification({
                recipientId: order.userId,
                recipientRole: "user",
                title: "Order Update",
                message: msgMap[status] || `Order status updated to ${status}`,
                type: "order",
                href: `/track/${order._id}`,
                metadata: { orderId: order._id.toString() },
            });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

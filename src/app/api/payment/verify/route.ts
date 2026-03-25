import crypto from "node:crypto";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";

export async function POST(req: Request) {
    try {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.json({ success: false, error: "Razorpay secret is not configured" }, { status: 400 });
        }

        const body = await req.json();
        const orderId = `${body.orderId || ""}`.trim();
        const razorpayOrderId = `${body.razorpayOrderId || ""}`.trim();
        const razorpayPaymentId = `${body.razorpayPaymentId || ""}`.trim();
        const razorpaySignature = `${body.razorpaySignature || ""}`.trim();

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return NextResponse.json({ success: false, error: "Missing payment verification details" }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json({ success: false, error: "Payment signature verification failed" }, { status: 400 });
        }

        await connectToDatabase();
        const order = await Order.findById(orderId);

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        order.transactionId = razorpayPaymentId;
        order.paymentMethod = "razorpay";
        order.paymentStatus = "verified";
        order.statusHistory = [
            ...(order.statusHistory || []),
            buildOrderHistoryEntry({
                status: order.status,
                deliveryStatus: order.deliveryStatus,
                label: "Payment verified",
                note: `Razorpay payment ${razorpayPaymentId} verified`,
                actorRole: "system",
            }),
        ];
        await order.save();

        if (order.userId) {
            await createNotification({
                recipientId: order.userId,
                recipientRole: "user",
                title: "Payment Verified",
                message: `Payment for order #${order._id.toString().slice(-6).toUpperCase()} was verified`,
                type: "payment",
                href: "/profile",
            });
        }

        await notifyAdmins({
            title: "Payment Verified",
            message: `Order #${order._id.toString().slice(-6).toUpperCase()} payment verified`,
            type: "payment",
            href: "/admin/orders",
        });

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

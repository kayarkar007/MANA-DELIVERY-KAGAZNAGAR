import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { createNotification, notifyAdmins } from "@/lib/notifications";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";
import { getRazorpayClient, verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const orderId = `${body.orderId || ""}`.trim();
        const razorpayOrderId = `${body.razorpayOrderId || ""}`.trim();
        const razorpayPaymentId = `${body.razorpayPaymentId || ""}`.trim();
        const razorpaySignature = `${body.razorpaySignature || ""}`.trim();

        if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return NextResponse.json({ success: false, error: "Missing payment verification details" }, { status: 400 });
        }

        if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            return NextResponse.json({ success: false, error: "Payment signature verification failed" }, { status: 400 });
        }

        await connectToDatabase();
        const order = await Order.findById(orderId);

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        if (order.userId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const razorpay = getRazorpayClient();
        const [razorpayOrder, razorpayPayment] = await Promise.all([
            razorpay.orders.fetch(razorpayOrderId),
            razorpay.payments.fetch(razorpayPaymentId),
        ]);

        if ((razorpayPayment as any).order_id !== razorpayOrderId) {
            return NextResponse.json({ success: false, error: "Payment does not belong to the supplied Razorpay order" }, { status: 400 });
        }

        if ((razorpayOrder as any).notes?.appOrderId !== orderId || (razorpayOrder as any).notes?.userId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Payment order does not match this application order" }, { status: 400 });
        }

        if (Number((razorpayPayment as any).amount) !== Math.round(Number(order.total || 0) * 100)) {
            return NextResponse.json({ success: false, error: "Payment amount does not match the application order" }, { status: 400 });
        }

        if (!["authorized", "captured"].includes((razorpayPayment as any).status)) {
            return NextResponse.json({ success: false, error: "Payment is not in a verified state" }, { status: 400 });
        }

        if (order.paymentStatus === "verified" && order.transactionId === razorpayPaymentId) {
            return NextResponse.json({ success: true, data: order, duplicate: true });
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

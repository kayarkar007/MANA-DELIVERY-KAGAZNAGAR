import crypto from "node:crypto";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";

export async function POST(req: Request) {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            return NextResponse.json({ success: false, error: "Razorpay webhook secret is not configured" }, { status: 400 });
        }

        const rawBody = await req.text();
        const signature = req.headers.get("x-razorpay-signature") || "";
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

        if (expectedSignature !== signature) {
            return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const event = payload?.event;
        const appOrderId = payload?.payload?.payment?.entity?.notes?.appOrderId;
        const paymentId = payload?.payload?.payment?.entity?.id;

        if (!appOrderId) {
            return NextResponse.json({ success: true, ignored: true });
        }

        await connectToDatabase();
        const order = await Order.findById(appOrderId);
        if (!order) {
            return NextResponse.json({ success: true, ignored: true });
        }

        if (event === "payment.captured") {
            order.paymentStatus = "verified";
        } else if (event === "payment.failed") {
            order.paymentStatus = "failed";
        }

        if (paymentId) {
            order.transactionId = paymentId;
        }

        order.statusHistory = [
            ...(order.statusHistory || []),
            buildOrderHistoryEntry({
                status: order.status,
                deliveryStatus: order.deliveryStatus,
                label: `Payment webhook: ${event}`,
                note: paymentId ? `Payment ID: ${paymentId}` : undefined,
                actorRole: "system",
            }),
        ];
        await order.save();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

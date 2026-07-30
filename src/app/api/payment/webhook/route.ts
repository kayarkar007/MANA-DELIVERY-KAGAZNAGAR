import crypto from "node:crypto";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";
import { processRefund } from "@/lib/refund";
import User from "@/models/User";

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
        const paymentEntity = payload?.payload?.payment?.entity;
        const refundEntity = payload?.payload?.refund?.entity;
        
        const appOrderId = paymentEntity?.notes?.appOrderId || refundEntity?.notes?.appOrderId;
        const paymentId = paymentEntity?.id || refundEntity?.payment_id;

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
        } else if (event === "refund.processed") {
            order.refundStatus = "processed";
            order.refundedAt = new Date();
            order.paymentStatus = "refunded";

            // If userId exists, credit wallet & send email
            if (order.userId) {
                const orderUser = await User.findById(order.userId).select("email").lean() as any;
                const refundAmount = (refundEntity?.amount ? refundEntity.amount / 100 : 0) || order.total;
                
                await processRefund({
                    orderId: order._id.toString(),
                    orderShortId: order._id.toString().slice(-6).toUpperCase(),
                    userId: order.userId,
                    customerName: order.customerName,
                    customerEmail: orderUser?.email,
                    refundAmount,
                    refundReason: refundEntity?.notes?.reason || "Razorpay Online Refund",
                });
            }
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

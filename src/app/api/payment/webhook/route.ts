import crypto from "node:crypto";
import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";
import { processRefund } from "@/lib/refund";
import User from "@/models/User";
import { getRequestId, logError, logInfo, logWarn } from "@/lib/observability";

export async function POST(req: Request) {
    const requestId = getRequestId(req);
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

        const expectedBuffer = Buffer.from(expectedSignature, "utf8");
        const signatureBuffer = Buffer.from(signature, "utf8");
        if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
            return NextResponse.json({ success: false, error: "Invalid webhook signature" }, { status: 400 });
        }

        const payload = JSON.parse(rawBody);
        const event = payload?.event;
        const paymentEntity = payload?.payload?.payment?.entity;
        const refundEntity = payload?.payload?.refund?.entity;
        
        const appOrderId = paymentEntity?.notes?.appOrderId || refundEntity?.notes?.appOrderId;
        const paymentId = paymentEntity?.id || refundEntity?.payment_id;

        if (!appOrderId) {
            logWarn("payment.webhook.ignored", { requestId, reason: "missing_app_order" });
            return NextResponse.json({ success: true, ignored: true });
        }

        await connectToDatabase();
        const order = await Order.findById(appOrderId);
        if (!order) {
            logWarn("payment.webhook.ignored", { requestId, reason: "order_not_found", orderId: appOrderId });
            return NextResponse.json({ success: true, ignored: true });
        }

        if (paymentEntity?.notes?.appOrderId && paymentEntity.notes.appOrderId !== order._id.toString()) {
            return NextResponse.json({ success: true, ignored: true });
        }

        if (paymentEntity?.order_id && order.paymentGatewayOrderId && paymentEntity.order_id !== order.paymentGatewayOrderId) {
            return NextResponse.json({ success: true, ignored: true });
        }

        if (
            (event === "payment.captured" && order.paymentStatus === "verified" && order.transactionId === paymentId) ||
            (event === "payment.failed" && order.paymentStatus === "failed" && order.transactionId === paymentId) ||
            (event === "refund.processed" && order.refundStatus === "processed")
        ) {
            logInfo("payment.webhook.duplicate", { requestId, orderId: appOrderId, event });
            return NextResponse.json({ success: true, duplicate: true });
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

        if (paymentEntity?.order_id && !order.paymentGatewayOrderId) {
            order.paymentGatewayOrderId = paymentEntity.order_id;
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

        logInfo("payment.webhook.processed", { requestId, orderId: appOrderId, event });

        return NextResponse.json({ success: true });
    } catch (error) {
        logError("payment.webhook.failed", error, { requestId });
        return NextResponse.json({ success: false, error: "Webhook processing failed" }, { status: 500 });
    }
}

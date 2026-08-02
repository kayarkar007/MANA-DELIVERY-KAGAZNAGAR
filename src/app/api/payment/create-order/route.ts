import { NextResponse } from "next/server";
import { requireUserFlexible } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { getRazorpayClient } from "@/lib/razorpay";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { getRequestId, logError, logInfo } from "@/lib/observability";

export async function POST(req: Request) {
    const requestId = getRequestId(req);
    const auth = await requireUserFlexible();
    if ("response" in auth) return auth.response;

    try {
        if (!isFeatureEnabled("payments")) {
            return NextResponse.json({ success: false, error: "Online payments are temporarily unavailable. Please use another payment method." }, { status: 503 });
        }

        const userId = auth.session.user.id;

        const body = await req.json();
        const amount = Number(body.amount);
        const appOrderId = `${body.appOrderId || ""}`.trim();
        const purpose = `${body.purpose || "order"}`.trim().toLowerCase();

        if (purpose !== "order" || !appOrderId) {
            return NextResponse.json(
                { success: false, error: "A valid application order is required." },
                { status: 400 }
            );
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { success: false, error: "Valid payment amount is required." },
                { status: 400 }
            );
        }

        await connectToDatabase();
        const order = await Order.findById(appOrderId).select("userId total paymentStatus status paymentGatewayOrderId");
        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found." },
                { status: 404 }
            );
        }

        if (order.userId !== userId) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        if (["cancelled", "delivered"].includes(order.status)) {
            return NextResponse.json({ success: false, error: "This order can no longer be paid online." }, { status: 400 });
        }

        if (order.paymentStatus === "verified") {
            return NextResponse.json({ success: false, error: "Payment already verified for this order." }, { status: 400 });
        }

        const expectedAmount = Number(order.total) || 0;
        if (Math.round(amount * 100) !== Math.round(expectedAmount * 100)) {
            return NextResponse.json({ success: false, error: "Payment amount does not match the order total." }, { status: 400 });
        }

        const razorpay = getRazorpayClient();

        if (order.paymentGatewayOrderId) {
            const existingOrder = await razorpay.orders.fetch(order.paymentGatewayOrderId);
            logInfo("payment.order.reused", { requestId, orderId: appOrderId });
            return NextResponse.json({ success: true, order: existingOrder, keyId: process.env.RAZORPAY_KEY_ID, duplicate: true });
        }

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: "INR",
            receipt: `order_${appOrderId}`,
            notes: {
                appOrderId,
                purpose,
                userId,
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        order.paymentMethod = "razorpay";
        order.paymentStatus = "pending";
        order.paymentGatewayOrderId = razorpayOrder.id;
        await order.save();

        logInfo("payment.order.created", { requestId, orderId: appOrderId });

        return NextResponse.json({ success: true, order: razorpayOrder, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        logError("payment.order.create_failed", error, { requestId });
        return NextResponse.json({ success: false, error: "Payment gateway error" }, { status: 500 });
    }
}

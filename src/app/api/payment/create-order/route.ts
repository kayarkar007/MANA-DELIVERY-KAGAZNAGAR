import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { getRazorpayClient } from "@/lib/razorpay";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const amount = Number(body.amount);
        const appOrderId = `${body.appOrderId || ""}`.trim();
        const purpose = `${body.purpose || "order"}`.trim().toLowerCase();
        const receipt = `${body.receipt || `${purpose}_${Date.now()}`}`.trim();

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
        const order = await Order.findById(appOrderId).select("userId total paymentStatus status");
        if (!order) {
            return NextResponse.json(
                { success: false, error: "Order not found." },
                { status: 404 }
            );
        }

        if (order.userId !== session.user.id) {
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

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: "INR",
            receipt,
            notes: {
                appOrderId,
                purpose,
                userId: session.user.id,
            },
        };

        const razorpayOrder = await razorpay.orders.create(options);

        order.paymentMethod = "razorpay";
        order.paymentStatus = "pending";
        await order.save();

        return NextResponse.json({ success: true, order: razorpayOrder, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error: any) {
        console.error("Razorpay Error:", error);
        return NextResponse.json({ success: false, error: "Payment gateway error" }, { status: 500 });
    }
}

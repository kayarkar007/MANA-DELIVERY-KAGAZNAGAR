import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const amount = Number(body.amount);
        const appOrderId = `${body.appOrderId || ""}`.trim();
        const purpose = `${body.purpose || "order"}`.trim();
        const userId = `${body.userId || ""}`.trim();
        const receipt = `${body.receipt || `${purpose}_${Date.now()}`}`.trim();

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json(
                { success: false, error: "Valid payment amount is required." },
                { status: 400 }
            );
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json(
                { success: false, error: "Razorpay credentials are not configured in the environment variables." },
                { status: 400 }
            );
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: "INR",
            receipt,
            notes: {
                appOrderId,
                purpose,
                userId,
            },
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error: any) {
        console.error("Razorpay Error:", error);
        return NextResponse.json({ success: false, error: "Payment gateway error" }, { status: 500 });
    }
}

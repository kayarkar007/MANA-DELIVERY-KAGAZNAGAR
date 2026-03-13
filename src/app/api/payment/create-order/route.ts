import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(req: Request) {
    try {
        const { amount } = await req.json();

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
            receipt: "receipt_" + Date.now(),
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error: any) {
        console.error("Razorpay Error:", error);
        return NextResponse.json({ success: false, error: "Payment gateway error" }, { status: 500 });
    }
}

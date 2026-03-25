import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return NextResponse.json(
                { success: false, error: "Razorpay credentials are not configured in the environment variables." },
                { status: 400 }
            );
        }

        const body = await req.json();
        const amount = Number(body.amount);

        if (!Number.isFinite(amount) || amount < 50) {
            return NextResponse.json({ success: false, error: "Minimum top-up amount is Rs 50" }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `wallet_topup_${Date.now()}`,
            notes: {
                purpose: "wallet_topup",
                userId: session.user.id,
            },
        });

        return NextResponse.json({ success: true, order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to create wallet top-up order" }, { status: 500 });
    }
}

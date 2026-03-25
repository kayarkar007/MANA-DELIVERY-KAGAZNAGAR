import { NextResponse } from "next/server";

export async function GET() {
    const razorpayConfigured = Boolean(
        process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    );

    return NextResponse.json({
        success: true,
        data: {
            razorpayConfigured,
            keyId: process.env.RAZORPAY_KEY_ID || null,
            minimumWalletTopup: 50,
        },
    });
}

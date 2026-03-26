import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

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

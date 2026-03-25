import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import WalletTransaction from "@/models/WalletTransaction";
import { createWalletTransaction } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
            return NextResponse.json({ success: false, error: "Razorpay secret is not configured" }, { status: 400 });
        }

        const body = await req.json();
        const amount = Number(body.amount);
        const razorpayOrderId = `${body.razorpayOrderId || ""}`.trim();
        const razorpayPaymentId = `${body.razorpayPaymentId || ""}`.trim();
        const razorpaySignature = `${body.razorpaySignature || ""}`.trim();

        if (!Number.isFinite(amount) || amount <= 0 || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return NextResponse.json({ success: false, error: "Missing wallet verification details" }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (expectedSignature !== razorpaySignature) {
            return NextResponse.json({ success: false, error: "Payment signature verification failed" }, { status: 400 });
        }

        await connectToDatabase();

        const existingTransaction = await WalletTransaction.findOne({
            source: "wallet_topup",
            referenceId: razorpayPaymentId,
            userId: session.user.id,
        });

        if (existingTransaction) {
            return NextResponse.json({ success: true, data: existingTransaction, duplicate: true });
        }

        const { transaction, balanceAfter } = await createWalletTransaction({
            userId: session.user.id,
            amount,
            type: "credit",
            source: "wallet_topup",
            note: `Wallet top-up via Razorpay (${razorpayPaymentId})`,
            referenceId: razorpayPaymentId,
        });

        await createNotification({
            recipientId: session.user.id,
            recipientRole: "user",
            title: "Wallet Recharged",
            message: `Rs ${amount.toFixed(2)} added to your wallet. New balance: Rs ${balanceAfter.toFixed(2)}`,
            type: "wallet",
            href: "/profile/wallet",
            metadata: { paymentId: razorpayPaymentId },
        });

        return NextResponse.json({ success: true, data: transaction, balanceAfter });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to verify wallet top-up" }, { status: 500 });
    }
}

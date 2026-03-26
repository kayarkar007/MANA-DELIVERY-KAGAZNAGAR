import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import WalletTransaction from "@/models/WalletTransaction";
import { createWalletTransaction } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";
import { getRazorpayClient, verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const razorpayOrderId = `${body.razorpayOrderId || ""}`.trim();
        const razorpayPaymentId = `${body.razorpayPaymentId || ""}`.trim();
        const razorpaySignature = `${body.razorpaySignature || ""}`.trim();

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return NextResponse.json({ success: false, error: "Missing wallet verification details" }, { status: 400 });
        }

        if (!verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)) {
            return NextResponse.json({ success: false, error: "Payment signature verification failed" }, { status: 400 });
        }

        await connectToDatabase();
        const razorpay = getRazorpayClient();
        const [razorpayOrder, razorpayPayment] = await Promise.all([
            razorpay.orders.fetch(razorpayOrderId),
            razorpay.payments.fetch(razorpayPaymentId),
        ]);

        if ((razorpayPayment as any).order_id !== razorpayOrderId) {
            return NextResponse.json({ success: false, error: "Payment does not belong to the supplied Razorpay order" }, { status: 400 });
        }

        if ((razorpayOrder as any).notes?.purpose !== "wallet_topup" || (razorpayOrder as any).notes?.userId !== session.user.id) {
            return NextResponse.json({ success: false, error: "Payment order does not belong to this wallet top-up request" }, { status: 400 });
        }

        if (!["authorized", "captured"].includes((razorpayPayment as any).status)) {
            return NextResponse.json({ success: false, error: "Payment is not in a verified state" }, { status: 400 });
        }

        if ((razorpayPayment as any).currency !== "INR" || (razorpayOrder as any).currency !== "INR") {
            return NextResponse.json({ success: false, error: "Unsupported payment currency" }, { status: 400 });
        }

        const creditedAmount = Number(((Number((razorpayPayment as any).amount) || 0) / 100).toFixed(2));
        if (creditedAmount <= 0 || Number((razorpayOrder as any).amount) !== Number((razorpayPayment as any).amount)) {
            return NextResponse.json({ success: false, error: "Payment amount mismatch" }, { status: 400 });
        }

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
            amount: creditedAmount,
            type: "credit",
            source: "wallet_topup",
            note: `Wallet top-up via Razorpay (${razorpayPaymentId})`,
            referenceId: razorpayPaymentId,
        });

        await createNotification({
            recipientId: session.user.id,
            recipientRole: "user",
            title: "Wallet Recharged",
            message: `Rs ${creditedAmount.toFixed(2)} added to your wallet. New balance: Rs ${balanceAfter.toFixed(2)}`,
            type: "wallet",
            href: "/profile/wallet",
            metadata: { paymentId: razorpayPaymentId },
        });

        return NextResponse.json({ success: true, data: transaction, balanceAfter });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to verify wallet top-up" }, { status: 500 });
    }
}

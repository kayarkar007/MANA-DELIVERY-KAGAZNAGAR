/**
 * refund.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Auto-refund engine for Mana Delivery.
 *
 * When admin marks a refund as "processed", this module:
 *   1. Credits the refund amount to the customer's wallet
 *   2. Sends a branded "Refund Processed" email to the customer
 *   3. Sends an in-app notification to the customer
 *
 * The wallet credit uses the existing `createWalletTransaction` to ensure
 * consistent balance tracking and deduplication.
 *
 * USAGE
 * ──────
 *  import { processRefund } from "@/lib/refund";
 *
 *  await processRefund({
 *    orderId:       order._id.toString(),
 *    userId:        order.userId,
 *    customerName:  order.customerName,
 *    customerEmail: userEmail,            // fetched separately from User model
 *    refundAmount:  getRefundCredit(order),
 *    refundReason:  order.refundReason,
 *  });
 */

import { createWalletTransaction } from "@/lib/wallet";
import { triggerNotification } from "@/lib/notifications";
import { sendEmail } from "@/lib/mailer";
import { refundProcessedEmail } from "@/lib/emailTemplates";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

export interface ProcessRefundInput {
    orderId: string;
    /** Short 6-char uppercase display ID for emails/notifications */
    orderShortId: string;
    userId: string;
    customerName: string;
    /** Optional — if provided, sends refund email. If missing, fetched from DB. */
    customerEmail?: string;
    refundAmount: number;
    refundReason?: string;
}

export interface ProcessRefundResult {
    walletCredited: boolean;
    emailSent: boolean;
    notificationSent: boolean;
    newWalletBalance?: number;
    error?: string;
}

export async function processRefund(input: ProcessRefundInput): Promise<ProcessRefundResult> {
    const result: ProcessRefundResult = {
        walletCredited: false,
        emailSent: false,
        notificationSent: false,
    };

    if (input.refundAmount <= 0) {
        result.error = "Refund amount must be greater than 0";
        return result;
    }

    // ── 1. Credit wallet ─────────────────────────────────────────────────────
    try {
        const { balanceAfter } = await createWalletTransaction({
            userId: input.userId,
            amount: input.refundAmount,
            type: "credit",
            source: "refund",
            note: `Refund processed for order #${input.orderShortId}`,
            orderId: input.orderId,
        });

        result.walletCredited = true;
        result.newWalletBalance = balanceAfter;
    } catch (walletError: any) {
        console.error("❌ Refund wallet credit failed:", walletError.message);
        result.error = `Wallet credit failed: ${walletError.message}`;
        // Don't abort — still try notification
    }

    // ── 2. Send refund email ──────────────────────────────────────────────────
    try {
        // Resolve email — use provided, or fetch from DB
        let email = input.customerEmail;
        if (!email) {
            await connectToDatabase();
            const user = await User.findById(input.userId).select("email").lean();
            email = (user as any)?.email;
        }

        if (email) {
            const html = refundProcessedEmail({
                customerName: input.customerName,
                orderId: input.orderShortId,
                refundAmount: input.refundAmount,
                refundReason: input.refundReason,
                newWalletBalance: result.newWalletBalance,
            });

            const emailResult = await sendEmail(
                email,
                `Refund of ₹${input.refundAmount.toFixed(2)} Processed – Mana Delivery`,
                html
            );

            result.emailSent = emailResult.success;
            if (!emailResult.success) {
                console.warn("⚠️  Refund email failed (non-fatal):", emailResult.error);
            }
        }
    } catch (emailError: any) {
        console.warn("⚠️  Refund email error (non-fatal):", emailError.message);
    }

    // ── 3. In-app notification ────────────────────────────────────────────────
    try {
        await triggerNotification({
            recipientId: input.userId,
            recipientRole: "user",
            title: "Refund Added to Wallet",
            message: `₹${input.refundAmount.toFixed(2)} credited for order #${input.orderShortId}`,
            type: "wallet",
            href: "/profile/wallet",
            metadata: { orderId: input.orderId },
        });

        result.notificationSent = true;
    } catch (notifError: any) {
        console.warn("⚠️  Refund notification error (non-fatal):", notifError.message);
    }

    return result;
}

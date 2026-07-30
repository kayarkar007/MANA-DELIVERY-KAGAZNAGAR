/**
 * referral.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Referral Program Engine for Mana Delivery.
 *  • Generates unique referral codes (e.g. MANA-5X9A) for each registered user.
 *  • Credits ₹50 to referrer's wallet upon referred user's first delivered order.
 */

import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Order from "@/models/Order";
import { createWalletTransaction } from "@/lib/wallet";
import { triggerNotification } from "@/lib/notifications";

export const REFERRAL_REWARD_AMOUNT = 50;

/** Generates a random unique referral code */
export function generateReferralCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "MANA-";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Ensures user has a unique referral code.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
    await connectToDatabase();
    const user = await User.findById(userId).select("referralCode");
    if (!user) throw new Error("User not found");

    if (user.referralCode) return user.referralCode;

    let code = generateReferralCode();
    let exists = await User.findOne({ referralCode: code });
    while (exists) {
        code = generateReferralCode();
        exists = await User.findOne({ referralCode: code });
    }

    user.referralCode = code;
    await user.save();
    return code;
}

/**
 * Processes referral reward when an order is completed/delivered.
 * Credits ₹50 to referrer if this is the referred user's first delivered order.
 */
export async function processReferralRewardOnDelivery(userId: string, orderId: string): Promise<boolean> {
    try {
        await connectToDatabase();
        const user = await User.findById(userId).select("referredBy");
        if (!user || !user.referredBy) return false;

        // Check if this is the user's first delivered order
        const deliveredOrdersCount = await Order.countDocuments({
            userId,
            status: "delivered",
        });

        // Only reward on the FIRST delivered order
        if (deliveredOrdersCount !== 1) return false;

        // Find the referrer by their referralCode
        const referrer = await User.findOne({ referralCode: user.referredBy });
        if (!referrer) return false;

        // Credit ₹50 to referrer's wallet
        await createWalletTransaction({
            userId: referrer._id.toString(),
            amount: REFERRAL_REWARD_AMOUNT,
            type: "credit",
            source: "admin_adjustment",
            note: `Referral bonus for inviting ${user.name || "friend"} to Mana Delivery`,
            orderId,
        });

        // Increment referrer count
        referrer.referralCount = (referrer.referralCount || 0) + 1;
        await referrer.save();

        // Push notification to referrer
        await triggerNotification({
            recipientId: referrer._id.toString(),
            recipientRole: "user",
            title: "Referral Bonus Received! 🎉",
            message: `₹${REFERRAL_REWARD_AMOUNT} credited to your wallet for inviting a friend!`,
            type: "wallet",
            href: "/profile/wallet",
        });

        return true;
    } catch (err: any) {
        console.warn("⚠️ Referral reward processing error (non-fatal):", err.message);
        return false;
    }
}

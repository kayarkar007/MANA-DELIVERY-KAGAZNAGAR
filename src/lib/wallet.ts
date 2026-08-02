import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";
import mongoose, { type ClientSession } from "mongoose";

type WalletEntryInput = {
    userId: string;
    amount: number;
    type: "credit" | "debit";
    source: "admin_adjustment" | "order_payment" | "refund" | "wallet_topup";
    note?: string;
    orderId?: string;
    referenceId?: string;
    createdBy?: string;
};

export async function createWalletTransaction(input: WalletEntryInput, session?: ClientSession) {
    await connectToDatabase();

    const ownedSession = !session;
    const activeSession = session || await mongoose.startSession();

    try {
        if (ownedSession) activeSession.startTransaction();

        if (input.referenceId) {
            const existing = await WalletTransaction.findOne({
                userId: input.userId,
                source: input.source,
                referenceId: input.referenceId,
            }).session(activeSession);

            if (existing) {
                if (ownedSession) await activeSession.commitTransaction();
                return { transaction: existing, balanceAfter: existing.balanceAfter, duplicate: true };
            }
        }

        const signedAmount = input.type === "credit" ? Math.abs(input.amount) : -Math.abs(input.amount);
        const balanceFilter = signedAmount < 0
            ? { _id: input.userId, walletBalance: { $gte: Math.abs(signedAmount) } }
            : { _id: input.userId };
        const user = await User.findOneAndUpdate(
            balanceFilter,
            { $inc: { walletBalance: signedAmount } },
            { new: true, session: activeSession, select: "walletBalance" }
        );

        if (!user) {
            throw new Error(signedAmount < 0 ? "Insufficient wallet balance" : "User not found");
        }

        const nextBalance = Number((Number(user.walletBalance) || 0).toFixed(2));
        const transaction = await WalletTransaction.create([{
            ...input,
            amount: Math.abs(input.amount),
            balanceAfter: nextBalance,
        }], { session: activeSession });

        if (ownedSession) await activeSession.commitTransaction();
        return { transaction: transaction[0], balanceAfter: nextBalance, duplicate: false };
    } catch (error) {
        if (ownedSession && activeSession.inTransaction()) await activeSession.abortTransaction();
        throw error;
    } finally {
        if (ownedSession) activeSession.endSession();
    }
}

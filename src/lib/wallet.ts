import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

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

export async function createWalletTransaction(input: WalletEntryInput) {
    await connectToDatabase();

    const user = await User.findById(input.userId).select("walletBalance");
    if (!user) {
        throw new Error("User not found");
    }

    const signedAmount = input.type === "credit" ? Math.abs(input.amount) : -Math.abs(input.amount);
    const nextBalance = Number(((Number(user.walletBalance) || 0) + signedAmount).toFixed(2));

    if (nextBalance < 0) {
        throw new Error("Insufficient wallet balance");
    }

    user.walletBalance = nextBalance;
    await user.save();

    const transaction = await WalletTransaction.create({
        ...input,
        amount: Math.abs(input.amount),
        balanceAfter: nextBalance,
    });

    return { transaction, balanceAfter: nextBalance };
}

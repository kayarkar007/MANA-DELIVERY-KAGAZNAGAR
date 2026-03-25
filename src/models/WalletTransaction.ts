import mongoose, { Schema, Document } from "mongoose";

export interface IWalletTransaction extends Document {
    userId: string;
    orderId?: string;
    referenceId?: string;
    amount: number;
    type: "credit" | "debit";
    source: "admin_adjustment" | "order_payment" | "refund" | "wallet_topup";
    note?: string;
    balanceAfter: number;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>({
    userId: { type: String, required: true, index: true },
    orderId: { type: String },
    referenceId: { type: String },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["credit", "debit"], required: true },
    source: {
        type: String,
        enum: ["admin_adjustment", "order_payment", "refund", "wallet_topup"],
        required: true,
    },
    note: { type: String, maxlength: 500 },
    balanceAfter: { type: Number, required: true },
    createdBy: { type: String },
}, { timestamps: true });

WalletTransactionSchema.index({ userId: 1, createdAt: -1 });
WalletTransactionSchema.index({ referenceId: 1 }, { sparse: true });

export default mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>("WalletTransaction", WalletTransactionSchema);

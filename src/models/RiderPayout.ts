import mongoose, { Schema, Document } from "mongoose";

export interface IRiderPayout extends Document {
    riderId: string;
    amount: number;
    status: "pending" | "paid";
    note?: string;
    createdBy?: string;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const RiderPayoutSchema = new Schema<IRiderPayout>({
    riderId: { type: String, required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    note: { type: String, maxlength: 500 },
    createdBy: { type: String },
    paidAt: { type: Date },
}, { timestamps: true });

RiderPayoutSchema.index({ riderId: 1, createdAt: -1 });

export default mongoose.models.RiderPayout || mongoose.model<IRiderPayout>("RiderPayout", RiderPayoutSchema);

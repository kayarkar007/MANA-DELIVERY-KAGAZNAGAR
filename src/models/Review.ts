import mongoose, { Schema, Document } from "mongoose";

export interface IReview extends Document {
    userId: string;
    orderId: string;
    productId?: string;
    rating: number; // 1 to 5
    comment?: string;
    status?: "approved" | "hidden";
    moderatedBy?: string;
    moderatedAt?: Date;
    moderationNote?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>({
    userId: { type: String, required: true },
    orderId: { type: String, required: true },
    productId: { type: String }, // Optional, can review specific product or just the order
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    status: { type: String, enum: ["approved", "hidden"], default: "approved" },
    moderatedBy: { type: String },
    moderatedAt: { type: Date },
    moderationNote: { type: String, maxlength: 500 },
}, { timestamps: true });

ReviewSchema.index({ status: 1, createdAt: -1 });


export default mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

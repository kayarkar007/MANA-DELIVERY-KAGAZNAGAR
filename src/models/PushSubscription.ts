import mongoose, { Document, Schema } from "mongoose";

export interface IPushSubscription extends Document {
    userId: string;
    userRole: "user" | "admin" | "rider";
    endpoint: string;
    expirationTime?: number | null;
    keys: {
        p256dh: string;
        auth: string;
    };
    userAgent?: string;
    isActive: boolean;
    lastUsedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
    userId: { type: String, required: true, index: true },
    userRole: { type: String, enum: ["user", "admin", "rider"], required: true },
    endpoint: { type: String, required: true, unique: true },
    expirationTime: { type: Number, default: null },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
    userAgent: { type: String },
    isActive: { type: Boolean, default: true, index: true },
    lastUsedAt: { type: Date },
}, { timestamps: true });

PushSubscriptionSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.PushSubscription || mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

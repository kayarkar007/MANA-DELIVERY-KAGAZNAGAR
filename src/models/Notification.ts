import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
    recipientId: string;
    recipientRole: "user" | "admin" | "rider";
    title: string;
    message: string;
    type: "order" | "support" | "wallet" | "system" | "review" | "payment";
    href?: string;
    metadata?: Record<string, any>;
    readAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
    recipientId: { type: String, required: true, index: true },
    recipientRole: { type: String, enum: ["user", "admin", "rider"], required: true },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 500 },
    type: {
        type: String,
        enum: ["order", "support", "wallet", "system", "review", "payment"],
        default: "system",
    },
    href: { type: String },
    metadata: { type: Schema.Types.Mixed },
    readAt: { type: Date },
}, { timestamps: true });

NotificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>("Notification", NotificationSchema);

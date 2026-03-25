import mongoose, { Schema, Document } from "mongoose";

export interface ISupportTicket extends Document {
    userId?: string;
    orderId?: string;
    customerName: string;
    customerPhone?: string;
    subject: string;
    message: string;
    category: "order" | "payment" | "delivery" | "refund" | "account" | "other";
    priority: "low" | "medium" | "high";
    status: "open" | "in_progress" | "resolved" | "closed";
    adminNotes?: string;
    assignedTo?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
    userId: { type: String, index: true },
    orderId: { type: String, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    subject: { type: String, required: true, maxlength: 140 },
    message: { type: String, required: true, maxlength: 2000 },
    category: {
        type: String,
        enum: ["order", "payment", "delivery", "refund", "account", "other"],
        default: "order",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open" },
    adminNotes: { type: String, maxlength: 2000 },
    assignedTo: { type: String },
    resolvedAt: { type: Date },
}, { timestamps: true });

SupportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

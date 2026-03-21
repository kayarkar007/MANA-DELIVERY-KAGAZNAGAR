import mongoose, { Schema, Document } from "mongoose";

export interface IOrder extends Document {
    type: "product" | "service";
    userId?: string;
    items?: Array<{
        productId: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    serviceCategory?: string;
    serviceDetails?: any;
    status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
    subtotal: number;
    deliveryFee: number;
    platformFee: number;
    tax: number;
    promoCode?: string;
    walletUsed?: number;
    total: number;
    tipAmount?: number;
    paymentMethod?: "cod" | "upi" | "wallet" | "razorpay";
    transactionId?: string;
    customerName: string;
    customerPhone: string;
    address: string;
    latitude: number;
    longitude: number;
    riderId?: string;
    riderLocation?: {
        latitude: number;
        longitude: number;
    };
    deliveryStatus: "pending" | "assigned" | "accepted" | "declined" | "picked_up" | "out_for_delivery" | "delivered" | "cancelled";
    deliveryOtp?: string;
    estimatedDeliveryTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema(
    {
        type: { type: String, enum: ["product", "service"], required: true },
        userId: { type: String },
        items: [
            {
                productId: { type: String },
                name: { type: String },
                price: { type: Number },
                quantity: { type: Number },
            },
        ],
        serviceCategory: { type: String },
        serviceDetails: { type: Schema.Types.Mixed },
        status: {
            type: String,
            enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
            default: "pending"
        },
        subtotal: { type: Number, required: true },
        deliveryFee: { type: Number, required: true },
        platformFee: { type: Number, required: true },
        tax: { type: Number, required: true },
        discountAmount: { type: Number, default: 0 },
        promoCode: { type: String },
        walletUsed: { type: Number, default: 0 },
        total: { type: Number, required: true },
        tipAmount: { type: Number, default: 0 },
        paymentMethod: { type: String, enum: ["cod", "upi", "wallet", "razorpay"], default: "cod" },
        transactionId: { type: String },
        customerName: { type: String, required: true },
        customerPhone: { type: String, required: true },
        address: { type: String, required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        riderLocation: {
            latitude: { type: Number },
            longitude: { type: Number }
        },
        deliveryStatus: {
            type: String,
            enum: ["pending", "assigned", "accepted", "declined", "picked_up", "out_for_delivery", "delivered", "cancelled"],
            default: "pending"
        },
        deliveryOtp: { type: String },
        estimatedDeliveryTime: { type: Date }
    },
    { timestamps: true }
);

// Indexes for Order Retrieval Speed
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ riderId: 1, deliveryStatus: 1 });
OrderSchema.index({ deliveryStatus: 1 });
OrderSchema.index({ createdAt: -1 });

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

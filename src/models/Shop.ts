import mongoose, { Schema, Document } from "mongoose";

export interface IShop extends Document {
    name: string;
    slug: string;
    description?: string;
    address: string;
    locationUrl?: string;
    latitude?: number;
    longitude?: number;
    ownerName: string;
    phone: string;
    image?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ShopSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String },
        address: { type: String, required: true },
        locationUrl: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        ownerName: { type: String, required: true },
        phone: { type: String, required: true },
        image: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

ShopSchema.index({ isActive: 1 });
ShopSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.models.Shop || mongoose.model<IShop>("Shop", ShopSchema);

import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    name: string;
    description?: string;
    price: number;
    unit: string;
    categorySlug: string;
    inStock: boolean;
    stockQuantity?: number;
    lowStockThreshold?: number;
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: false },
        price: { type: Number, required: true },
        unit: { type: String, required: true },
        categorySlug: { type: String, required: true },
        inStock: { type: Boolean, default: true },
        stockQuantity: { type: Number, default: 10, min: 0 },
        lowStockThreshold: { type: Number, default: 5, min: 0 },
        image: { type: String, required: false },
    },
    { timestamps: true }
);

// Indexes for performance optimization
ProductSchema.index({ name: "text", categorySlug: 1 });
ProductSchema.index({ inStock: 1 });
ProductSchema.index({ price: 1 });

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

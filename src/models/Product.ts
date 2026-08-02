import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    name: string;
    slug?: string;
    description?: string;
    price: number;
    unit: string;
    categorySlug: string;
    shopId?: mongoose.Types.ObjectId | string;
    inStock: boolean;
    stockQuantity?: number;
    lowStockThreshold?: number;
    image?: string;
    isHidden: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: false },
        description: { type: String, required: false },
        price: { type: Number, required: true },
        unit: { type: String, required: true },
        categorySlug: { type: String, required: true },
        shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: false },
        inStock: { type: Boolean, default: true },
        stockQuantity: { type: Number, default: 10, min: 0 },
        lowStockThreshold: { type: Number, default: 5, min: 0 },
        image: { type: String, required: false },
        isHidden: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Indexes for performance optimization
ProductSchema.index({ name: "text", categorySlug: 1 });
ProductSchema.index({ slug: 1 });
ProductSchema.index({ inStock: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isHidden: 1, categorySlug: 1 });
ProductSchema.index({ isHidden: 1, shopId: 1, createdAt: -1 });
ProductSchema.index({ isHidden: 1, price: 1, createdAt: -1 });

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

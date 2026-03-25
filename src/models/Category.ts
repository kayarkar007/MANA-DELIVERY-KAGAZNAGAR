import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
    name: string;
    slug: string;
    type: "product" | "service";
    image?: string;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        type: { type: String, enum: ["product", "service"], required: true },
        image: { type: String, required: false },
    },
    { timestamps: true }
);

export default mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

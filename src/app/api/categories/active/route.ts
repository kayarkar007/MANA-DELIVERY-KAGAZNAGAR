import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";

// Returns only categories that have at least 1 product assigned
// Used by homepage "Shop by Category" to auto-sync when products are added to shops
export async function GET() {
    try {
        await connectToDatabase();

        // Get all distinct categorySlug values from products that are in-stock
        const activeSlugDocs = await Product.distinct("categorySlug", {
            categorySlug: { $exists: true, $ne: "" },
            isHidden: { $ne: true },
        });

        if (!activeSlugDocs.length) {
            return NextResponse.json({ success: true, data: [] });
        }

        const categories = await Category.find({
            slug: { $in: activeSlugDocs },
        })
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json({ success: true, data: JSON.parse(JSON.stringify(categories)) });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch active categories" },
            { status: 500 }
        );
    }
}

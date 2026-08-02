import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { publicJson } from "@/lib/publicResponse";

// Returns only categories that have at least 1 product assigned
// Used by homepage "Shop by Category" to auto-sync when products are added to shops
export async function GET() {
    const startedAt = Date.now();
    try {
        await connectToDatabase();

        // Get all distinct categorySlug values from products that are in-stock
        const activeSlugDocs = await Product.distinct("categorySlug", {
            categorySlug: { $exists: true, $ne: "" },
            isHidden: { $ne: true },
        });

        if (!activeSlugDocs.length) {
            return publicJson({ success: true, data: [] }, startedAt, 300);
        }

        const categories = await Category.find({
            slug: { $in: activeSlugDocs },
        })
            .select("name slug type image createdAt")
            .sort({ createdAt: -1 })
            .limit(100)
            .maxTimeMS(2_000)
            .lean();

        return publicJson({ success: true, data: JSON.parse(JSON.stringify(categories)) }, startedAt, 300);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch active categories" },
            { status: 500 }
        );
    }
}

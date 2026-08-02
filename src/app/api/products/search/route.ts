import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Product from "@/models/Product";
import { publicJson } from "@/lib/publicResponse";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
    const startedAt = Date.now();
    try {
        const { searchParams } = new URL(request.url);
        const query = `${searchParams.get("q") || ""}`.trim().slice(0, 100);
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10) || 10));
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const sort = searchParams.get("sort");

        await connectToDatabase();

        const dbQuery: any = { isHidden: { $ne: true } };

        if (query) {
            const searchRegex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            dbQuery.$or = [
                { name: searchRegex },
                { categorySlug: searchRegex }
            ];
        }

        if (minPrice || maxPrice) {
            const minimum = minPrice ? Number(minPrice) : undefined;
            const maximum = maxPrice ? Number(maxPrice) : undefined;
            if ((minimum !== undefined && (!Number.isFinite(minimum) || minimum < 0)) ||
                (maximum !== undefined && (!Number.isFinite(maximum) || maximum < 0)) ||
                (minimum !== undefined && maximum !== undefined && minimum > maximum)) {
                return NextResponse.json({ success: false, error: "Invalid price range" }, { status: 400 });
            }
            dbQuery.price = {};
            if (minimum !== undefined) dbQuery.price.$gte = minimum;
            if (maximum !== undefined) dbQuery.price.$lte = maximum;
        }

        let sortOption: any = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        if (sort === 'price_desc') sortOption = { price: -1 };

        const products = await Product.find(dbQuery)
            .select("name slug description price unit categorySlug shopId inStock stockQuantity image createdAt")
            .sort(sortOption)
            .limit(limit)
            .maxTimeMS(2_000)
            .lean();

        return publicJson({ success: true, data: products }, startedAt, query ? 30 : 60);
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to search products" },
            { status: 400 }
        );
    }
}

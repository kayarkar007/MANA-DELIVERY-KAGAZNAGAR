import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Product from "@/models/Product";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get("q");
        const limit = parseInt(searchParams.get("limit") || "10");
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");
        const sort = searchParams.get("sort");

        await connectToDatabase();

        const dbQuery: any = { isHidden: { $ne: true } };

        if (query) {
            const searchRegex = new RegExp(query, "i");
            dbQuery.$or = [
                { name: searchRegex },
                { categorySlug: searchRegex }
            ];
        }

        if (minPrice || maxPrice) {
            dbQuery.price = {};
            if (minPrice) dbQuery.price.$gte = Number(minPrice);
            if (maxPrice) dbQuery.price.$lte = Number(maxPrice);
        }

        let sortOption: any = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { price: 1 };
        if (sort === 'price_desc') sortOption = { price: -1 };

        const products = await Product.find(dbQuery).sort(sortOption).limit(limit).lean();

        return NextResponse.json({ success: true, data: products });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to search products" },
            { status: 400 }
        );
    }
}

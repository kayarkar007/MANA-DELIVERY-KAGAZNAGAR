import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Review from "@/models/Review";

// POST { productIds: string[] } → returns avg rating + count per productId
export async function POST(req: Request) {
    try {
        const { productIds } = await req.json();

        if (!Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ success: true, data: [] });
        }

        await connectToDatabase();

        // Aggregate average rating per productId
        // Reviews are linked to orders; for product-level display we treat all 
        // reviews for orders containing a productId via Review.productId field.
        // If productId is not set on review, we show order-level reviews by orderId.
        // Here we aggregate by orderId as a proxy (per-category).
        const pipeline = [
            { $match: { productId: { $in: productIds }, status: "approved" } },
            {
                $group: {
                    _id: "$productId",
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                }
            }
        ];

        const results = await Review.aggregate(pipeline);

        const data = results.map((r: any) => ({
            productId: r._id,
            avgRating: Math.round(r.avgRating * 10) / 10,
            count: r.count,
        }));

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

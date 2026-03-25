import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { requireAdmin } from "@/lib/routeAuth";
import Product from "@/models/Product";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categorySlug = searchParams.get("categorySlug");
        const search = `${searchParams.get("search") || ""}`.trim();
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 100));

        await connectToDatabase();

        let query: Record<string, any> = {};
        if (categorySlug) {
            query = { categorySlug };
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Product.countDocuments(query);
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const normalizedProducts = products.map((product: any) => ({
            ...product.toObject(),
            stockQuantity: product.stockQuantity ?? (product.inStock ? 10 : 0),
            lowStockThreshold: product.lowStockThreshold ?? 5,
            inStock: product.stockQuantity !== undefined ? product.stockQuantity > 0 : product.inStock,
        }));

        return NextResponse.json({
            success: true,
            data: normalizedProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch products" },
            { status: 400 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const body = await request.json();
        const stockQuantity = Math.max(0, Number(body.stockQuantity) || 0);
        const lowStockThreshold = Math.max(0, Number(body.lowStockThreshold) || 5);
        const product = await Product.create({
            ...body,
            stockQuantity,
            lowStockThreshold,
            inStock: stockQuantity > 0,
        });
        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to create product" },
            { status: 400 }
        );
    }
}

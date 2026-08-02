import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { requireAdmin } from "@/lib/routeAuth";
import Product from "@/models/Product";
import { publicJson } from "@/lib/publicResponse";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const startedAt = Date.now();
    try {
        const { searchParams } = new URL(request.url);
        // Accept both categorySlug and category (legacy alias)
        const categorySlug = searchParams.get("categorySlug") || searchParams.get("category");
        const shopId = searchParams.get("shopId");
        const search = `${searchParams.get("search") || ""}`.trim().slice(0, 100);
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 50));
        const sortParam = searchParams.get("sort") || "newest";

        await connectToDatabase();

        const adminView = searchParams.get("adminView") === "1";
        if (adminView) {
            const auth = await requireAdmin();
            if ("response" in auth) return auth.response;
        }

        let query: Record<string, any> = {};
        if (!adminView) {
            // Customers never see hidden products
            query.isHidden = { $ne: true };
        }
        if (categorySlug) {
            query.categorySlug = categorySlug;
        }
        if (shopId) {
            query.shopId = shopId;
        }
        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            query.$or = [
                { name: { $regex: escapedSearch, $options: "i" } },
                { description: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        // Build sort object based on sort param
        let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
        if (sortParam === "price_asc") sortObj = { price: 1 };
        else if (sortParam === "price_desc") sortObj = { price: -1 };
        else if (sortParam === "name_asc") sortObj = { name: 1 };
        else if (sortParam === "name_desc") sortObj = { name: -1 };
        else if (sortParam === "popular") sortObj = { salesCount: -1, createdAt: -1 };

        const [total, products] = await Promise.all([
            Product.countDocuments(query).maxTimeMS(8_000),
            Product.find(query)
                .select("name slug description price unit categorySlug shopId inStock stockQuantity lowStockThreshold image createdAt updatedAt")
                .populate("shopId", "name slug image isActive")
                .sort(sortObj)
                .skip((page - 1) * limit)
                .limit(limit)
                .maxTimeMS(8_000)
                .lean(),
        ]);

        const normalizedProducts = products.map((product: any) => ({
            ...product,
            stockQuantity: product.stockQuantity ?? (product.inStock ? 10 : 0),
            lowStockThreshold: product.lowStockThreshold ?? 5,
            inStock: product.stockQuantity !== undefined ? product.stockQuantity > 0 : product.inStock,
        }));

        const payload = {
            success: true,
            data: normalizedProducts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        };

        return adminView
            ? NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } })
            : publicJson(payload, startedAt, search ? 30 : 60);
    } catch (error: any) {
        console.error("❌ [/api/products GET] error:", error?.message ?? error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch products", products: [], data: [], pagination: { page: 1, limit: 50, total: 0, totalPages: 1 } },
            { status: 200 }
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
            shopId: body.shopId || undefined,
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

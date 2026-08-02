import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import connectToDatabase from "@/lib/mongoose";
import Product from "@/models/Product";
import { requireVendor } from "@/lib/routeAuth";


/** GET /api/vendor/products — List all products for vendor's shop */
export async function GET(request: Request) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        if (!session.user.shopId) {
            return NextResponse.json({ success: true, data: [] });
        }

        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search")?.trim() || "";
        const inStockOnly = searchParams.get("inStock") === "true";

        const query: Record<string, any> = { shopId: session.user.shopId };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { categorySlug: { $regex: search, $options: "i" } },
            ];
        }
        if (inStockOnly) query.inStock = true;

        const products = await Product.find(query).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ success: true, data: products, total: products.length });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/** POST /api/vendor/products — Add new product to vendor's shop */
export async function POST(request: Request) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        if (!session.user.shopId) {
            return NextResponse.json({ success: false, error: "No shop linked to your vendor account." }, { status: 400 });
        }

        await connectToDatabase();
        const body = await request.json();
        const { name, description, price, unit, categorySlug, stockQuantity, lowStockThreshold, image, isHidden } = body;

        if (!name || !price || !unit || !categorySlug) {
            return NextResponse.json(
                { success: false, error: "name, price, unit, and categorySlug are required." },
                { status: 400 }
            );
        }

        if (typeof price !== "number" || price <= 0) {
            return NextResponse.json({ success: false, error: "price must be a positive number." }, { status: 400 });
        }

        // Auto-generate slug from name
        const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now();

        const product = await Product.create({
            name: name.trim(),
            slug,
            description: description?.trim(),
            price,
            unit: unit.trim(),
            categorySlug: categorySlug.trim(),
            shopId: session.user.shopId,
            stockQuantity: stockQuantity ?? 10,
            lowStockThreshold: lowStockThreshold ?? 5,
            inStock: (stockQuantity ?? 10) > 0,
            image: image?.trim(),
            isHidden: isHidden ?? false,
        });

        revalidateTag("home-categories", "layout");
        revalidatePath("/", "layout");

        return NextResponse.json({ success: true, data: product }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

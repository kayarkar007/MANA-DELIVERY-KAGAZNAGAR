import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import connectToDatabase from "@/lib/mongoose";
import Product from "@/models/Product";
import { requireVendor } from "@/lib/routeAuth";


/** GET /api/vendor/products/[id] — Get single product (must belong to vendor's shop) */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const { id } = await params;

        await connectToDatabase();
        const product = await Product.findOne({ _id: id, shopId: session.user.shopId }).lean();

        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: product });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/** PATCH /api/vendor/products/[id] — Update own product */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const { id } = await params;

        await connectToDatabase();
        const body = await request.json();

        // Verify product belongs to this vendor's shop
        const existing = await Product.findOne({ _id: id, shopId: session.user.shopId });
        if (!existing) {
            return NextResponse.json({ success: false, error: "Product not found or not yours." }, { status: 404 });
        }

        const allowedFields = ["name", "description", "price", "unit", "categorySlug", "stockQuantity", "lowStockThreshold", "image", "isHidden", "inStock"];
        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) updates[field] = body[field];
        }

        // Auto-sync inStock based on stockQuantity if provided
        if (updates.stockQuantity !== undefined) {
            updates.inStock = updates.stockQuantity > 0;
        }

        const updated = await Product.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
        
        revalidateTag("home-categories", "layout");
        revalidatePath("/", "layout");

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/** DELETE /api/vendor/products/[id] — Delete own product */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        const { id } = await params;

        await connectToDatabase();
        const product = await Product.findOneAndDelete({ _id: id, shopId: session.user.shopId });

        if (!product) {
            return NextResponse.json({ success: false, error: "Product not found or not yours." }, { status: 404 });
        }

        revalidateTag("home-categories", "layout");
        revalidatePath("/", "layout");

        return NextResponse.json({ success: true, message: "Product deleted successfully." });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

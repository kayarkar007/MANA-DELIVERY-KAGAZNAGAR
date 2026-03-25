import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { requireAdmin } from "@/lib/routeAuth";
import Product from "@/models/Product";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const params = await context.params;
        const id = params.id;
        const body = await request.json();
        const stockQuantity = Math.max(0, Number(body.stockQuantity) || 0);
        const lowStockThreshold = Math.max(0, Number(body.lowStockThreshold) || 5);
        const product = await Product.findByIdAndUpdate(
            id,
            {
                ...body,
                stockQuantity,
                lowStockThreshold,
                inStock: stockQuantity > 0,
            },
            { new: true }
        );
        if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: product });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 400 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const params = await context.params;
        const id = params.id;
        const product = await Product.findByIdAndDelete(id);
        if (!product) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 400 });
    }
}

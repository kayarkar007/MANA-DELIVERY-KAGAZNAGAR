import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { requireAdmin } from "@/lib/routeAuth";
import Shop from "@/models/Shop";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const params = await context.params;
        const id = params.id;
        const body = await request.json();
        const shop = await Shop.findByIdAndUpdate(id, body, { returnDocument: "after" });
        if (!shop) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: shop });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to update shop" }, { status: 400 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const params = await context.params;
        const id = params.id;
        const shop = await Shop.findByIdAndDelete(id);
        if (!shop) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to delete shop" }, { status: 400 });
    }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        await connectToDatabase();
        const params = await context.params;
        const slug = params.id; // treating id as slug for the generic fetch
        
        let shop;
        if (slug.match(/^[0-9a-fA-F]{24}$/)) {
            shop = await Shop.findById(slug);
        } else {
            shop = await Shop.findOne({ slug });
        }
        
        if (!shop) return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: shop });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to fetch shop" }, { status: 400 });
    }
}

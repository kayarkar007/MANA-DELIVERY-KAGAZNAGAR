import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { requireAdmin } from "@/lib/routeAuth";
import Category from "@/models/Category";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const params = await context.params;
        const id = params.id;
        const body = await request.json();
        const category = await Category.findByIdAndUpdate(id, body, { new: true });
        if (!category) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to update category" }, { status: 400 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const params = await context.params;
        const id = params.id;
        const category = await Category.findByIdAndDelete(id);
        if (!category) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
        return NextResponse.json({ success: true, data: {} });
    } catch (error) {
        return NextResponse.json({ success: false, error: "Failed to delete category" }, { status: 400 });
    }
}

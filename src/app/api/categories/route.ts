import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { requireAdmin } from "@/lib/routeAuth";
import Category from "@/models/Category";

export async function GET() {
    try {
        await connectToDatabase();
        const categories = await Category.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: categories });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch categories" },
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
        const category = await Category.create(body);
        return NextResponse.json({ success: true, data: category });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to create category" },
            { status: 400 }
        );
    }
}

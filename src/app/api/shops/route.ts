import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { requireAdmin } from "@/lib/routeAuth";
import Shop from "@/models/Shop";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const adminView = searchParams.get("adminView") === "1";
        if (adminView) {
            const auth = await requireAdmin();
            if ("response" in auth) return auth.response;
        }

        await connectToDatabase();
        const shops = await Shop.find(adminView ? {} : { isActive: true }).sort({ createdAt: -1 });
        return NextResponse.json({ success: true, data: shops });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch shops" },
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
        const shop = await Shop.create(body);
        return NextResponse.json({ success: true, data: shop });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Failed to create shop" },
            { status: 400 }
        );
    }
}

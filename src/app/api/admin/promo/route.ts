import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import PromoCode from "@/models/PromoCode";
import { requireAdmin } from "@/lib/routeAuth";

export async function GET() {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const promos = await PromoCode.find().sort({ createdAt: -1 }).lean();
        return NextResponse.json({ success: true, data: promos });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const body = await req.json();
        const promo = await PromoCode.create(body);
        return NextResponse.json({ success: true, data: promo });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ success: false, error: "Promo code already exists" }, { status: 400 });
        }
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false }, { status: 400 });

        await connectToDatabase();
        await PromoCode.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

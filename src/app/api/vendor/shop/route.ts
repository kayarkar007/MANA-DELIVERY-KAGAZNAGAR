import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Shop from "@/models/Shop";
import { requireVendor } from "@/lib/routeAuth";

/** GET /api/vendor/shop — Get vendor's own shop profile */
export async function GET() {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        if (!session.user.shopId) {
            return NextResponse.json({ success: false, error: "No shop linked to this vendor account." }, { status: 404 });
        }

        await connectToDatabase();
        const shop = await Shop.findById(session.user.shopId).lean();

        if (!shop) {
            return NextResponse.json({ success: false, error: "Shop not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: shop });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

/** PATCH /api/vendor/shop — Update vendor's shop profile */
export async function PATCH(request: Request) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        if (!session.user.shopId) {
            return NextResponse.json({ success: false, error: "No shop linked to this vendor account." }, { status: 404 });
        }

        await connectToDatabase();
        const body = await request.json();

        // Vendors can only update these fields
        const allowedFields = ["name", "description", "address", "phone", "image", "locationUrl", "isActive"];
        const updates: Record<string, any> = {};
        for (const field of allowedFields) {
            if (body[field] !== undefined) updates[field] = body[field];
        }

        const shop = await Shop.findByIdAndUpdate(
            session.user.shopId,
            updates,
            { new: true, runValidators: true }
        ).lean();

        if (!shop) {
            return NextResponse.json({ success: false, error: "Shop not found." }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: shop });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

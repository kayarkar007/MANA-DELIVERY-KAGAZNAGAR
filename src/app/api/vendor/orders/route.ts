import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { requireVendor } from "@/lib/routeAuth";

/** GET /api/vendor/orders — Orders that contain products from vendor's shop */
export async function GET(request: Request) {
    try {
        const auth = await requireVendor();
        if ("response" in auth) return auth.response;

        const { session } = auth;
        if (!session.user.shopId) {
            return NextResponse.json({ success: true, data: [], total: 0 });
        }

        await connectToDatabase();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));

        const shopIdStr = session.user.shopId.toString();

        // Find orders that have items from this vendor's shop
        const query: Record<string, any> = {
            "items.shop.shopId": shopIdStr,
        };
        if (status) query.status = status;

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: orders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

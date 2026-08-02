import { NextRequest, NextResponse } from "next/server";
import { requireAdminFlexible } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";

const ORDER_STATUSES = new Set(["pending", "processing", "shipped", "delivered", "cancelled"]);

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: NextRequest) {
    const auth = await requireAdminFlexible();
    if ("response" in auth) return auth.response;

    try {
        await connectToDatabase();

        const searchParams = request.nextUrl.searchParams;
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 20));
        const status = searchParams.get("status") || "";
        const search = (searchParams.get("search") || "").trim().slice(0, 100);
        const query: Record<string, unknown> = {};

        if (ORDER_STATUSES.has(status)) query.status = status;
        if (search) {
            const pattern = new RegExp(escapeRegex(search), "i");
            query.$or = [
                { customerName: pattern },
                { customerPhone: pattern },
                { promoCode: pattern },
            ];
        }

        const [total, orders] = await Promise.all([
            Order.countDocuments(query),
            Order.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select("customerName status deliveryStatus total paymentMethod paymentStatus createdAt updatedAt items")
                .lean(),
        ]);

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
    } catch (error) {
        console.error("Failed to retrieve admin orders:", error);
        return NextResponse.json({ success: false, error: "Failed to retrieve orders" }, { status: 500 });
    }
}

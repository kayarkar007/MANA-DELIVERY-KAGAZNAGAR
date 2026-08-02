import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";
import { requireAdminFlexible } from "@/lib/routeAuth";

export async function POST(req: Request) {
    try {
        const auth = await requireAdminFlexible();
        if ("response" in auth) return auth.response;
        const { session } = auth;

        const body = await req.json() as { orderIds?: unknown; status?: unknown };
        const { orderIds, status } = body;

        if (!Array.isArray(orderIds) || orderIds.length === 0 || typeof status !== "string") {
            return NextResponse.json({ success: false, error: "orderIds array and status are required" }, { status: 400 });
        }

        const uniqueOrderIds = [...new Set(orderIds)];
        if (
            uniqueOrderIds.length > 100 ||
            uniqueOrderIds.some((orderId) => typeof orderId !== "string" || !mongoose.isValidObjectId(orderId))
        ) {
            return NextResponse.json(
                { success: false, error: "Provide up to 100 valid order IDs." },
                { status: 400 }
            );
        }

        const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        await connectToDatabase();

        const historyEntry = buildOrderHistoryEntry({
            status,
            deliveryStatus: status === "delivered" ? "delivered" : status === "cancelled" ? "cancelled" : undefined,
            label: `Bulk status update to ${status}`,
            actorRole: "admin",
            actorId: session.user.id,
        });

        const updateFields: Record<string, any> = {
            status,
            $push: { statusHistory: historyEntry },
        };

        if (status === "delivered") {
            updateFields.deliveryStatus = "delivered";
        } else if (status === "cancelled") {
            updateFields.deliveryStatus = "cancelled";
        }

        const result = await Order.updateMany(
            { _id: { $in: uniqueOrderIds } },
            updateFields
        );

        return NextResponse.json({
            success: true,
            updatedCount: result.modifiedCount,
            message: `Successfully updated ${result.modifiedCount} orders to ${status}`,
        });
    } catch (error) {
        console.error("Failed to bulk update orders", error);
        return NextResponse.json({ success: false, error: "Unable to update order status." }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { orderIds, status } = body;

        if (!Array.isArray(orderIds) || orderIds.length === 0 || !status) {
            return NextResponse.json({ success: false, error: "orderIds array and status are required" }, { status: 400 });
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
            { _id: { $in: orderIds } },
            updateFields
        );

        return NextResponse.json({
            success: true,
            updatedCount: result.modifiedCount,
            message: `Successfully updated ${result.modifiedCount} orders to ${status}`,
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

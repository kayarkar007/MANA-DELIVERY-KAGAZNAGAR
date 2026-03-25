import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch last 500 orders focusing on their coordinates
        const orders = await Order.find(
            { latitude: { $exists: true }, longitude: { $exists: true } }
        ).sort({ createdAt: -1 }).limit(500).select("latitude longitude status");

        const heatmapData = orders.map((order: any) => ({
            lat: order.latitude,
            lng: order.longitude,
            status: order.status
        }));

        return NextResponse.json({ success: true, data: heatmapData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


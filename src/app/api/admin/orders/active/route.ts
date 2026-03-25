import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/routeAuth";

export async function GET() {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        // Fetch orders that are pending, processing, or shipped
        const activeOrders = await Order.find({
            status: { $in: ["pending", "processing", "shipped"] }
        }).sort({ createdAt: -1 }).lean();

        // Convert coordinates to numbers and ensure they exist
        const mapData = activeOrders.map((order: any) => ({
            id: order._id,
            status: order.deliveryStatus === "out_for_delivery" ? "shipped" : order.status,
            deliveryStatus: order.deliveryStatus,
            customerName: order.customerName,
            address: order.address,
            phone: order.customerPhone,
            total: order.total,
            items: order.items?.length || 0,
            time: new Date(order.createdAt).toLocaleTimeString(),
            lat: Number(order.riderLocation?.latitude ?? order.latitude),
            lng: Number(order.riderLocation?.longitude ?? order.longitude),
            hasLiveRiderLocation: Boolean(order.riderLocation?.latitude && order.riderLocation?.longitude),
        })).filter((order) => !isNaN(order.lat) && !isNaN(order.lng));

        return NextResponse.json({ success: true, data: mapData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

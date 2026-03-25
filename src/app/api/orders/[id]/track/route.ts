import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await connectToDatabase();
    const { id: orderId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const accessOrder = await Order.findById(orderId).select("userId riderId");
    if (!accessOrder) {
        return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const ownerId = accessOrder.userId?.toString?.() ?? accessOrder.userId;
    const riderId = accessOrder.riderId?.toString?.() ?? accessOrder.riderId;
    const canAccess =
        session.user.role === "admin" ||
        ownerId === session.user.id ||
        (session.user.role === "rider" && riderId === session.user.id);

    if (!canAccess) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();

            const sendEvent = (data: any) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch {
                    // Stream closed by client.
                }
            };

            let lastLat: number | null = null;
            let lastLng: number | null = null;
            let lastStatus: string | null = null;
            let lastDeliveryStatus: string | null = null;

            const interval = setInterval(async () => {
                try {
                    const order = await Order.findById(orderId).select("riderLocation status deliveryStatus latitude longitude");
                    if (!order) return;

                    const loc = order.riderLocation;
                    const hasLocationChanged = loc && (loc.latitude !== lastLat || loc.longitude !== lastLng);
                    const hasStatusChanged = order.status !== lastStatus || order.deliveryStatus !== lastDeliveryStatus;

                    if (hasLocationChanged || hasStatusChanged) {
                        lastLat = loc?.latitude || null;
                        lastLng = loc?.longitude || null;
                        lastStatus = order.status;
                        lastDeliveryStatus = order.deliveryStatus;

                        sendEvent({
                            riderLocation: loc,
                            status: order.status,
                            deliveryStatus: order.deliveryStatus,
                            latitude: order.latitude,
                            longitude: order.longitude,
                        });
                    }
                } catch {
                    // Ignore transient polling errors.
                }
            }, 3000);

            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
                try {
                    controller.close();
                } catch {
                    // Stream already closed.
                }
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
        },
    });
}

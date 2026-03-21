import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    await connectToDatabase();
    const { id: orderId } = await params;

    const stream = new ReadableStream({
        async start(controller) {
            const encoder = new TextEncoder();
            
            const sendEvent = (data: any) => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                } catch (e) {
                    // stream likely closed
                }
            };

            // Using setInterval polling against MongoDB (3 seconds) to emulate 
            // a resilient SSE connection that won't crash on standalone (non-replica) databases.
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
                            longitude: order.longitude
                        });
                    }
                } catch (err) {
                    // Transient DB error
                }
            }, 3000);

            // Cleanup when client disconnects
            req.signal.addEventListener("abort", () => {
                clearInterval(interval);
                try { controller.close(); } catch (e) {}
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        },
    });
}

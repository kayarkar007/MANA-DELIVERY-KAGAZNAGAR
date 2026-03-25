import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import { hydrateOrderItemImages } from "@/lib/orderData";
import { getMappedOrderStatus } from "@/lib/orderPresentation";
import Order from "@/models/Order";
import User from "@/models/User";

function canAccessOrder(order: any, session: any) {
    const ownerId = order.userId?.toString?.() ?? order.userId;
    const riderId = order.riderId?.toString?.() ?? order.riderId;

    return (
        session.user.role === "admin" ||
        ownerId === session.user.id ||
        (session.user.role === "rider" && riderId === session.user.id)
    );
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const resolvedParams = await params;
        await connectToDatabase();

        const order = await Order.findById(resolvedParams.id);

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        if (!canAccessOrder(order, session)) {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        const hydratedOrder = await hydrateOrderItemImages(order);
        return NextResponse.json({ success: true, data: hydratedOrder });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const order = await Order.findById(resolvedParams.id);
        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        const ownerId = order.userId?.toString?.() ?? order.userId;
        if (ownerId !== session.user.id && session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        if (order.status !== "pending") {
            return NextResponse.json(
                { success: false, error: "Order can only be cancelled when it is pending" },
                { status: 400 }
            );
        }

        order.status = "cancelled";
        order.deliveryStatus = "cancelled";
        order.set("riderLocation", undefined);
        await order.save();

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const status = body.status as string | undefined;
        const riderId = body.riderId as string | undefined;
        const deliveryStatus = body.deliveryStatus as string | undefined;

        if (status) {
            const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
            }
        }

        await connectToDatabase();

        const order = await Order.findById(resolvedParams.id);
        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        const previousStatus = order.status;
        const previousDeliveryStatus = order.deliveryStatus;

        let assignedRider: any = null;

        if (riderId !== undefined) {
            const normalizedRiderId = `${riderId}`.trim();

            if (normalizedRiderId) {
                assignedRider = await User.findOne({ _id: normalizedRiderId, role: "rider" }).select("name whatsapp");
                if (!assignedRider) {
                    return NextResponse.json({ success: false, error: "Rider not found" }, { status: 404 });
                }

                order.riderId = normalizedRiderId;
                order.deliveryStatus = "assigned";
                order.status = getMappedOrderStatus("assigned", order.status);
                order.set("riderLocation", undefined);
            } else {
                order.set("riderId", undefined);
                order.set("riderLocation", undefined);

                if (!["delivered", "cancelled"].includes(order.status)) {
                    order.deliveryStatus = "pending";
                    if (order.status === "shipped") {
                        order.status = "processing";
                    }
                }
            }
        }

        if (deliveryStatus) {
            order.deliveryStatus = deliveryStatus as any;
            order.status = getMappedOrderStatus(deliveryStatus, order.status) as any;
        }

        if (status) {
            order.status = status as any;

            if (status === "delivered") {
                order.deliveryStatus = "delivered";
            }

            if (status === "cancelled") {
                order.deliveryStatus = "cancelled";
                order.set("riderLocation", undefined);
            }
        }

        await order.save();

        let whatsappRedirectUrl = null;
        let riderWhatsappUrl = null;

        if (assignedRider?.whatsapp) {
            const orderId = order._id.toString().slice(-6).toUpperCase();
            const riderMsg = `Hi ${assignedRider.name}, you have been assigned a new Mana Delivery order #${orderId}. Please visit your dashboard to accept: ${process.env.NEXTAUTH_URL}/rider`;
            const cleanRiderPhone = assignedRider.whatsapp.replace(/\D/g, "");
            const finalRiderPhone = cleanRiderPhone.length === 10 ? `91${cleanRiderPhone}` : cleanRiderPhone;
            riderWhatsappUrl = `https://wa.me/${finalRiderPhone}?text=${encodeURIComponent(riderMsg)}`;
        }

        const hasCustomerFacingChange =
            order.customerPhone &&
            (order.status !== previousStatus || order.deliveryStatus !== previousDeliveryStatus);

        if (hasCustomerFacingChange) {
            let message = "";
            const orderId = order._id.toString().slice(-6).toUpperCase();

            if (order.status === "processing") {
                message = `Hi ${order.customerName}, your Mana Delivery order #${orderId} is now being prepared.`;
            } else if (order.status === "shipped") {
                message = `Hi ${order.customerName}, your Mana Delivery order #${orderId} is on the way.`;
            } else if (order.status === "delivered") {
                message = `Hi ${order.customerName}, your Mana Delivery order #${orderId} has been delivered. Thank you for ordering with us.`;
            } else if (order.status === "cancelled") {
                message = `Hi ${order.customerName}, your Mana Delivery order #${orderId} has been cancelled.`;
            }

            if (message) {
                const cleanPhone = order.customerPhone.replace(/\D/g, "");
                const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                whatsappRedirectUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;
            }
        }

        const hydratedOrder = await hydrateOrderItemImages(order);

        return NextResponse.json(
            { success: true, data: hydratedOrder, whatsappRedirectUrl, riderWhatsappUrl },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

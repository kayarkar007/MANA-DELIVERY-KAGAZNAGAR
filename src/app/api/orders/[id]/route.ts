import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import { hydrateOrderItemImages } from "@/lib/orderData";
import { getInventoryItems, restoreInventory } from "@/lib/inventory";
import { getMappedOrderStatus } from "@/lib/orderPresentation";
import { createNotification } from "@/lib/notifications";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";
import { createWalletTransaction } from "@/lib/wallet";
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

function getRefundCredit(order: any) {
    let amount = Number(order.walletUsed) || 0;
    if (["upi", "razorpay"].includes(order.paymentMethod)) {
        amount += Number(order.total) || 0;
    }
    return Number(amount.toFixed(2));
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

        const refundCredit = getRefundCredit(order);
        const inventoryItems = order.type === "product" ? getInventoryItems(order.items) : [];

        order.status = "cancelled";
        order.deliveryStatus = "cancelled";
        order.refundStatus = refundCredit > 0 ? "processed" : "none";
        order.refundedAt = refundCredit > 0 ? new Date() : undefined;
        order.set("riderLocation", undefined);
        order.statusHistory = [
            ...(order.statusHistory || []),
            buildOrderHistoryEntry({
                status: "cancelled",
                deliveryStatus: "cancelled",
                label: "Order cancelled",
                note: refundCredit > 0 ? `Refund credited to wallet: Rs ${refundCredit.toFixed(2)}` : "Cancelled before processing",
                actorRole: session.user.role,
                actorId: session.user.id,
            }),
        ];
        await order.save();

        if (inventoryItems.length > 0) {
            await restoreInventory(inventoryItems);
        }

        if (refundCredit > 0 && order.userId) {
            await createWalletTransaction({
                userId: order.userId,
                amount: refundCredit,
                type: "credit",
                source: "refund",
                note: `Refund for cancelled order #${order._id.toString().slice(-6).toUpperCase()}`,
                orderId: order._id.toString(),
            });

            await createNotification({
                recipientId: order.userId,
                recipientRole: "user",
                title: "Refund Added to Wallet",
                message: `Rs ${refundCredit.toFixed(2)} credited for order #${order._id.toString().slice(-6).toUpperCase()}`,
                type: "wallet",
                href: "/profile/wallet",
                metadata: { orderId: order._id.toString() },
            });
        }

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
        const refundStatus = body.refundStatus as string | undefined;
        const refundReason = body.refundReason as string | undefined;

        if (status) {
            const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
            }
        }

        if (refundStatus) {
            const validRefundStatuses = ["none", "requested", "approved", "rejected", "processed"];
            if (!validRefundStatuses.includes(refundStatus)) {
                return NextResponse.json({ success: false, error: "Invalid refund status" }, { status: 400 });
            }
        }

        await connectToDatabase();

        const order = await Order.findById(resolvedParams.id);
        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        const previousStatus = order.status;
        const previousDeliveryStatus = order.deliveryStatus;
        const previousRefundStatus = order.refundStatus;
        const inventoryItems = order.type === "product" ? getInventoryItems(order.items) : [];

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
                order.statusHistory = [
                    ...(order.statusHistory || []),
                    buildOrderHistoryEntry({
                        status: order.status,
                        deliveryStatus: "assigned",
                        label: "Rider assigned",
                        note: `${assignedRider.name} assigned by admin`,
                        actorRole: "admin",
                        actorId: session.user.id,
                    }),
                ];
            } else {
                order.set("riderId", undefined);
                order.set("riderLocation", undefined);

                if (!["delivered", "cancelled"].includes(order.status)) {
                    order.deliveryStatus = "pending";
                    if (order.status === "shipped") {
                        order.status = "processing";
                    }
                }

                order.statusHistory = [
                    ...(order.statusHistory || []),
                    buildOrderHistoryEntry({
                        status: order.status,
                        deliveryStatus: order.deliveryStatus,
                        label: "Rider unassigned",
                        actorRole: "admin",
                        actorId: session.user.id,
                    }),
                ];
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

        if (refundStatus) {
            order.refundStatus = refundStatus as any;
            if (refundReason !== undefined) {
                order.refundReason = refundReason;
            }

            if (refundStatus === "requested") {
                order.refundRequestedAt = new Date();
            }

            if (refundStatus === "processed" && previousRefundStatus !== "processed") {
                const refundCredit = getRefundCredit(order);
                if (refundCredit > 0 && order.userId) {
                    await createWalletTransaction({
                        userId: order.userId,
                        amount: refundCredit,
                        type: "credit",
                        source: "refund",
                        note: `Refund processed for order #${order._id.toString().slice(-6).toUpperCase()}`,
                        orderId: order._id.toString(),
                    });
                }
                order.refundedAt = new Date();
                if (order.paymentStatus !== "failed") {
                    order.paymentStatus = "refunded";
                }
            }
        }

        if (
            order.status !== previousStatus ||
            order.deliveryStatus !== previousDeliveryStatus ||
            order.refundStatus !== previousRefundStatus
        ) {
            order.statusHistory = [
                ...(order.statusHistory || []),
                buildOrderHistoryEntry({
                    status: order.status,
                    deliveryStatus: order.deliveryStatus,
                    label:
                        order.refundStatus !== previousRefundStatus
                            ? `Refund ${order.refundStatus}`
                            : `Status updated to ${order.status}`,
                    note: refundReason || undefined,
                    actorRole: "admin",
                    actorId: session.user.id,
                }),
            ];
        }

        const shouldRestoreInventory =
            previousStatus !== "cancelled" &&
            order.status === "cancelled" &&
            inventoryItems.length > 0;

        await order.save();

        if (shouldRestoreInventory) {
            await restoreInventory(inventoryItems);
        }

        let whatsappRedirectUrl = null;
        let riderWhatsappUrl = null;

        if (assignedRider?.whatsapp) {
            const orderId = order._id.toString().slice(-6).toUpperCase();
            const siteUrl = process.env.NEXTAUTH_URL || "https://manadelivery.vercel.app";
            const riderMsg = `Hi ${assignedRider.name}, you have been assigned a new Mana Delivery order #${orderId}. Please visit your dashboard to accept: ${siteUrl}/rider`;
            const cleanRiderPhone = assignedRider.whatsapp.replace(/\D/g, "");
            const finalRiderPhone = cleanRiderPhone.length === 10 ? `91${cleanRiderPhone}` : cleanRiderPhone;
            riderWhatsappUrl = `https://wa.me/${finalRiderPhone}?text=${encodeURIComponent(riderMsg)}`;

            await createNotification({
                recipientId: order.riderId.toString(),
                recipientRole: "rider",
                title: "New Rider Assignment",
                message: `Order #${order._id.toString().slice(-6).toUpperCase()} assigned to you`,
                type: "order",
                href: "/rider",
                metadata: { orderId: order._id.toString() },
            });
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

        if (order.userId) {
            const notificationMessage =
                order.refundStatus !== previousRefundStatus
                    ? `Refund status for order #${order._id.toString().slice(-6).toUpperCase()} is now ${order.refundStatus}`
                    : `Order #${order._id.toString().slice(-6).toUpperCase()} is now ${order.status}`;

            await createNotification({
                recipientId: order.userId,
                recipientRole: "user",
                title: order.refundStatus !== previousRefundStatus ? "Refund Update" : "Order Update",
                message: notificationMessage,
                type: order.refundStatus !== previousRefundStatus ? "payment" : "order",
                href: "/profile",
                metadata: { orderId: order._id.toString() },
            });
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

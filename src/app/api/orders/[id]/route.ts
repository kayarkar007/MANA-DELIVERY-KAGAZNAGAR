import { NextResponse } from "next/server";
import { requireAdminFlexible, requireAuthenticatedFlexible } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import { hydrateOrderItemImages } from "@/lib/orderData";
import { getInventoryItems, restoreInventory } from "@/lib/inventory";
import { getMappedOrderStatus } from "@/lib/orderPresentation";
import { triggerNotification } from "@/lib/notifications";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";
import { createWalletTransaction } from "@/lib/wallet";
import { processRefund } from "@/lib/refund";
import { sendEmail } from "@/lib/mailer";
import { riderAssignedEmail, orderDeliveredEmail } from "@/lib/emailTemplates";
import { sendOrderStatusSMS } from "@/lib/sms";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { processReferralRewardOnDelivery } from "@/lib/referral";
import { canTransitionDeliveryStatus, canTransitionOrderStatus, isDeliveryStatus, isOrderStatus } from "@/lib/orderState";
import { hideDeliveryOtp, revealDeliveryOtpForOwner } from "@/lib/deliveryOtp";
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
        const auth = await requireAuthenticatedFlexible();
        if ("response" in auth) return auth.response;
        const { session } = auth;

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
        const ownerId = order.userId?.toString?.() ?? order.userId;
        const responseOrder = ownerId === session.user.id
            ? revealDeliveryOtpForOwner(hydratedOrder)
            : hideDeliveryOtp(hydratedOrder);
        return NextResponse.json({ success: true, data: responseOrder });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const auth = await requireAuthenticatedFlexible();
        if ("response" in auth) return auth.response;
        const { session } = auth;

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

            await triggerNotification({
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
        const auth = await requireAdminFlexible();
        if ("response" in auth) return auth.response;
        const { session } = auth;

        const body = await req.json();
        const status = body.status as string | undefined;
        const riderId = body.riderId as string | undefined;
        const deliveryStatus = body.deliveryStatus as string | undefined;
        const refundStatus = body.refundStatus as string | undefined;
        const refundReason = body.refundReason as string | undefined;

        if (status) {
            if (!isOrderStatus(status)) {
                return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
            }
        }

        if (deliveryStatus && !isDeliveryStatus(deliveryStatus)) {
            return NextResponse.json({ success: false, error: "Invalid delivery status" }, { status: 400 });
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
        const previousRiderId = order.riderId?.toString?.() ?? "";
        const inventoryItems = order.type === "product" ? getInventoryItems(order.items) : [];

        if (status && !canTransitionOrderStatus(order.status, status)) {
            return NextResponse.json({ success: false, error: `Cannot move order from ${order.status} to ${status}` }, { status: 400 });
        }

        if (deliveryStatus && !canTransitionDeliveryStatus(order.deliveryStatus, deliveryStatus)) {
            return NextResponse.json({ success: false, error: `Cannot move delivery from ${order.deliveryStatus} to ${deliveryStatus}` }, { status: 400 });
        }

        let assignedRider: any = null;
        let riderAssignmentChanged = false;

        if (riderId !== undefined) {
            const normalizedRiderId = `${riderId}`.trim();
            riderAssignmentChanged = normalizedRiderId !== previousRiderId;

            if (normalizedRiderId) {
                if (riderAssignmentChanged) {
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
                }
            } else {
                if (riderAssignmentChanged) {
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
        }

        if (deliveryStatus) {
            order.deliveryStatus = deliveryStatus as any;
            order.status = getMappedOrderStatus(deliveryStatus, order.status) as any;
        }

        if (status) {
            order.status = status as any;

            if (status === "delivered") {
                order.deliveryStatus = "delivered";
                if (order.userId) {
                    processReferralRewardOnDelivery(order.userId, order._id.toString()).catch(() => {});
                }
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
                    // Fetch customer email for refund notification (non-blocking)
                    const orderUser = await User.findById(order.userId).select("email").lean() as any;

                    // processRefund handles wallet credit + email + in-app notification
                    await processRefund({
                        orderId:      order._id.toString(),
                        orderShortId: order._id.toString().slice(-6).toUpperCase(),
                        userId:       order.userId,
                        customerName: order.customerName,
                        customerEmail: orderUser?.email,
                        refundAmount: refundCredit,
                        refundReason: order.refundReason,
                    });
                }
                order.refundedAt = new Date();
                if (order.paymentStatus !== "failed") {
                    order.paymentStatus = "refunded";
                }
            }
        }

        const statusChanged = order.status !== previousStatus;
        const deliveryChanged = order.deliveryStatus !== previousDeliveryStatus;
        const refundChanged = order.refundStatus !== previousRefundStatus;

        if (statusChanged || deliveryChanged || refundChanged) {
            order.statusHistory = [
                ...(order.statusHistory || []),
                buildOrderHistoryEntry({
                    status: order.status,
                    deliveryStatus: order.deliveryStatus,
                    label:
                        refundChanged
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

        if (riderAssignmentChanged && assignedRider?.whatsapp) {
            const orderId = order._id.toString().slice(-6).toUpperCase();
            const siteUrl = process.env.NEXTAUTH_URL || "https://manadelivery.vercel.app";
            const riderMsg = `Hi ${assignedRider.name}, you have been assigned a new Mana Delivery order #${orderId}. Please visit your dashboard to accept: ${siteUrl}/rider`;
            const cleanRiderPhone = assignedRider.whatsapp.replace(/\D/g, "");
            const finalRiderPhone = cleanRiderPhone.length === 10 ? `91${cleanRiderPhone}` : cleanRiderPhone;
            riderWhatsappUrl = `https://wa.me/${finalRiderPhone}?text=${encodeURIComponent(riderMsg)}`;

            await triggerNotification({
                recipientId: order.riderId.toString(),
                recipientRole: "rider",
                title: "New Rider Assignment",
                message: `Order #${order._id.toString().slice(-6).toUpperCase()} assigned to you`,
                type: "order",
                href: "/rider",
                metadata: { orderId: order._id.toString() },
            });
        }

        // ── Email notifications on status changes ─────────────────────────────────
        if (order.userId && (statusChanged || riderAssignmentChanged)) {
            try {
                const orderUser = await User.findById(order.userId).select("email").lean() as any;
                const customerEmail = orderUser?.email;

                if (customerEmail) {
                    const shortId = order._id.toString().slice(-6).toUpperCase();

                    if (riderAssignmentChanged && order.deliveryStatus === "assigned" && assignedRider) {
                        // Rider assigned email
                        await sendEmail(
                            customerEmail,
                            `Rider Assigned for Order #${shortId} – Mana Delivery`,
                            riderAssignedEmail({
                                customerName: order.customerName,
                                orderId: shortId,
                                riderName: assignedRider.name,
                            })
                        );
                    } else if (order.status === "delivered") {
                        // Order delivered email
                        await sendEmail(
                            customerEmail,
                            `Order #${shortId} Delivered! – Mana Delivery`,
                            orderDeliveredEmail({
                                customerName: order.customerName,
                                orderId: shortId,
                                orderTotal: order.total,
                            })
                        );
                    }
                }
            } catch (emailErr: any) {
                // Non-fatal — log but don't fail the request
                console.warn("⚠️  Status-change email error (non-fatal):", emailErr.message);
            }
        }

        // ── SMS & WhatsApp notifications on status changes ────────────────────────
        if (order.customerPhone && (statusChanged || riderAssignmentChanged)) {
            (async () => {
                try {
                    const shortId = order._id.toString().slice(-6).toUpperCase();
                    await sendOrderStatusSMS(order.customerPhone, shortId, order.status);

                    let waStatus: "placed" | "assigned" | "shipped" | "delivered" | "cancelled" | null = null;
                    if (riderAssignmentChanged && order.deliveryStatus === "assigned") waStatus = "assigned";
                    else if (order.status === "shipped") waStatus = "shipped";
                    else if (order.status === "delivered") waStatus = "delivered";
                    else if (order.status === "cancelled") waStatus = "cancelled";

                    if (waStatus) {
                        await sendWhatsAppMessage({
                            toPhone: order.customerPhone,
                            customerName: order.customerName,
                            orderShortId: shortId,
                            status: waStatus,
                            riderName: assignedRider?.name,
                            totalAmount: order.total,
                            lang: "te",
                        });
                    }
                } catch (smsErr: any) {
                    console.warn("⚠️ Status-change SMS/WhatsApp error (non-fatal):", smsErr.message);
                }
            })();
        }

        const hasCustomerFacingChange =
            order.customerPhone &&
            (statusChanged || deliveryChanged || riderAssignmentChanged);

        if (hasCustomerFacingChange) {
            let message = "";
            const orderId = order._id.toString().slice(-6).toUpperCase();

            if (riderAssignmentChanged && order.deliveryStatus === "assigned") {
                message = `Hi ${order.customerName}, a rider has been assigned to your Mana Delivery order #${orderId}.`;
            } else if (order.status === "processing") {
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

        if (order.userId && (statusChanged || deliveryChanged || refundChanged || riderAssignmentChanged)) {
            const notificationMessage =
                refundChanged
                    ? `Refund status for order #${order._id.toString().slice(-6).toUpperCase()} is now ${order.refundStatus}`
                    : riderAssignmentChanged && order.deliveryStatus === "assigned"
                        ? `A rider has been assigned to order #${order._id.toString().slice(-6).toUpperCase()}`
                    : `Order #${order._id.toString().slice(-6).toUpperCase()} is now ${order.status}`;

            await triggerNotification({
                recipientId: order.userId,
                recipientRole: "user",
                title: refundChanged ? "Refund Update" : "Order Update",
                message: notificationMessage,
                type: refundChanged ? "payment" : "order",
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

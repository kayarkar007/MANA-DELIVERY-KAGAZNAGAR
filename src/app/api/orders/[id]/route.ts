import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        await connectToDatabase();
        const order = await Order.findById(resolvedParams.id);

        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: order });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// DELETE: User cancels their own pending order
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

        // Only order owner or admin can cancel
        if (order.userId !== session.user.id && session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        // Only allow cancel if still pending
        if (order.status !== "pending") {
            return NextResponse.json({ 
                success: false, 
                error: "Order can only be cancelled when it is pending" 
            }, { status: 400 });
        }

        order.status = "cancelled";
        order.deliveryStatus = "cancelled";
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

        const { status, riderId, deliveryStatus } = await req.json();

        // Validate Status Enum if provided
        if (status) {
            const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
            if (!validStatuses.includes(status)) {
                return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
            }
        }

        await connectToDatabase();

        const updateData: any = {};
        if (status) updateData.status = status;
        if (riderId) {
            updateData.riderId = riderId;
            updateData.deliveryStatus = "assigned";
        }
        if (deliveryStatus) updateData.deliveryStatus = deliveryStatus;

        const updatedOrder = await Order.findByIdAndUpdate(
            resolvedParams.id,
            updateData,
            { new: true }
        );

        if (!updatedOrder) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        let whatsappRedirectUrl = null;
        let riderWhatsappUrl = null;

        // Notify Rider if assigned
        if (riderId) {
            const rider = await User.findById(riderId);
            if (rider && rider.whatsapp) {
                const orderId = updatedOrder._id.toString().slice(-6).toUpperCase();
                const riderMsg = `Hi ${rider.name}, you have been assigned a new Mana Delivery order #${orderId}. Please visit your dashboard to accept: ${process.env.NEXTAUTH_URL}/rider`;
                const cleanRiderPhone = rider.whatsapp.replace(/\D/g, '');
                const finalRiderPhone = cleanRiderPhone.length === 10 ? `91${cleanRiderPhone}` : cleanRiderPhone;
                riderWhatsappUrl = `https://wa.me/${finalRiderPhone}?text=${encodeURIComponent(riderMsg)}`;
            }
        }

        if (["processing", "shipped", "delivered"].includes(status) && updatedOrder.customerPhone) {
            let message = "";
            const orderId = updatedOrder._id.toString().slice(-6).toUpperCase();

            if (status === "processing") {
                message = `Hi ${updatedOrder.customerName}, your Mana Delivery order #${orderId} is now being processed. We will notify you once it's shipped!`;
            } else if (status === "shipped") {
                message = `Hi ${updatedOrder.customerName}, your Mana Delivery order #${orderId} has been shipped and is on its way to you!`;
            } else if (status === "delivered") {
                message = `Hi ${updatedOrder.customerName}, your Mana Delivery order #${orderId} has been delivered. Thank you for shopping with us!`;
            }

            const cleanPhone = updatedOrder.customerPhone.replace(/\D/g, ''); // Remove non-digits
            // Assuming Indian numbers default if no country code
            const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

            whatsappRedirectUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

            // Mock Email / Push Notification Dispatch
            console.info(`[Notification] Order Update for #${orderId} - User: ${updatedOrder.customerName}. Message: ${message}`);
            // if (process.env.RESEND_API_KEY) { await resend.emails.send({...}) }
        }

        return NextResponse.json({ success: true, data: updatedOrder, whatsappRedirectUrl, riderWhatsappUrl }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

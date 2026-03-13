import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { status } = await req.json();

        // Validate Status Enum
        const validStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
        }

        await connectToDatabase();

        const updatedOrder = await Order.findByIdAndUpdate(
            resolvedParams.id,
            { status },
            { new: true }
        );

        if (!updatedOrder) {
            return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
        }

        let whatsappRedirectUrl = null;

        if (["processing", "shipped", "delivered"].includes(status) && updatedOrder.customerPhone) {
            let message = "";
            const orderId = updatedOrder._id.toString().slice(-6).toUpperCase();

            if (status === "processing") {
                message = `Hi ${updatedOrder.customerName}, your Localu order #${orderId} is now being processed. We will notify you once it's shipped!`;
            } else if (status === "shipped") {
                message = `Hi ${updatedOrder.customerName}, your Localu order #${orderId} has been shipped and is on its way to you!`;
            } else if (status === "delivered") {
                message = `Hi ${updatedOrder.customerName}, your Localu order #${orderId} has been delivered. Thank you for shopping with us!`;
            }

            const cleanPhone = updatedOrder.customerPhone.replace(/\D/g, ''); // Remove non-digits
            // Assuming Indian numbers default if no country code
            const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

            whatsappRedirectUrl = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

            // Mock Email / Push Notification Dispatch
            console.info(`[Notification] Order Update for #${orderId} - User: ${updatedOrder.customerName}. Message: ${message}`);
            // if (process.env.RESEND_API_KEY) { await resend.emails.send({...}) }
        }

        return NextResponse.json({ success: true, data: updatedOrder, whatsappRedirectUrl }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

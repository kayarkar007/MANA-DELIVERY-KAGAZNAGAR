import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { requireUser } from "@/lib/routeAuth";

export async function POST(request: Request) {
    try {
        await connectToDatabase();
        const body = await request.json();
        const session = await getServerSession(authOptions);

        if (session?.user?.id) {
            body.userId = session.user.id;
        }

        const { type, customerName, customerPhone, address, latitude, longitude, tipAmount } = body;

        let subtotal = 0;
        const deliveryFee = 30;
        const platformFee = 5;
        let tax = 0;

        let whatsappText = "";

        if (type === "product") {
            const { items } = body;
            items.forEach((item: any) => {
                subtotal += item.price * item.quantity;
            });
            tax = subtotal * 0.05;

            const total = subtotal + deliveryFee + platformFee + tax + (tipAmount || 0);

            body.subtotal = subtotal;
            body.deliveryFee = deliveryFee;
            body.platformFee = platformFee;
            body.tax = tax;
            body.tipAmount = tipAmount || 0;
            body.total = total;

            whatsappText = `New Product Order:
--------------------------------
${items.map((i: any) => `${i.name} x ${i.quantity} = ₹${i.price * i.quantity}`).join("\n")}
--------------------------------
Subtotal: ₹${subtotal.toFixed(2)}
Delivery Fee: ₹${deliveryFee}
Platform Fee: ₹${platformFee}
Tax: ₹${tax.toFixed(2)}
${body.discountAmount ? `Discount (-): ₹${body.discountAmount.toFixed(2)}\n` : ''}${body.walletUsed ? `Wallet Applied (-): ₹${body.walletUsed.toFixed(2)}\n` : ''}${body.tipAmount ? `Rider Tip (+): ₹${body.tipAmount.toFixed(2)}\n` : ''}Total: ₹${body.total.toFixed(2)}
--------------------------------
Customer: ${customerName}
Phone: ${customerPhone}
Address: ${address}
Google Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
        } else if (type === "service") {
            const { serviceCategory, serviceDetails } = body;

            // Mock dynamic pricing logic
            if (serviceCategory === "Petrol Delivery") {
                subtotal = (serviceDetails.quantity || 1) * 105; // Mock 105 per liter
            } else if (serviceCategory === "Pickup & Drop") {
                subtotal = 150; // Mock base rate
            } else {
                subtotal = 200;
            }

            tax = subtotal * 0.05;
            const total = subtotal + deliveryFee + platformFee + tax + (tipAmount || 0);

            body.subtotal = subtotal;
            body.deliveryFee = deliveryFee;
            body.platformFee = platformFee;
            body.tax = tax;
            body.tipAmount = tipAmount || 0;
            body.total = total;

            const detailsText = Object.entries(serviceDetails || {})
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n");

            whatsappText = `New Service Request:
--------------------------------
Service Type: ${serviceCategory}
Details:
${detailsText}
--------------------------------
Estimated Price: ₹${total.toFixed(2)}
${body.tipAmount ? `Rider Tip (+): ₹${body.tipAmount.toFixed(2)}\n` : ''}--------------------------------
Customer: ${customerName}
Phone: ${customerPhone}
Address: ${address}
Google Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
        }

        // Generate a 4-digit secure delivery PIN (0-cost verification)
        const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();
        const deliveryOtp = generateOTP();

        const order = await Order.create({
            type,
            userId: body.userId,
            items: body.items,
            serviceCategory: body.serviceCategory,
            serviceDetails: body.serviceDetails,
            status: "pending",
            subtotal: body.subtotal,
            deliveryFee: body.deliveryFee,
            platformFee: body.platformFee,
            tax: body.tax,
            discountAmount: body.discountAmount || 0,
            promoCode: body.promoCode,
            walletUsed: body.walletUsed || 0,
            total: body.total,
            tipAmount: body.tipAmount || 0,
            paymentMethod: body.paymentMethod || "cod",
            transactionId: body.transactionId,
            customerName,
            customerPhone,
            address,
            latitude,
            longitude,
            deliveryStatus: "pending",
            deliveryOtp,
        });

        const finalWhatsappText = whatsappText +
            `\n--------------------------------
Payment: ${(body.paymentMethod || "cod").toUpperCase()}
${body.transactionId ? `Txn ID: ${body.transactionId}\n` : ''}--------------------------------
Order Tracking ID: #${order._id.toString().slice(-6).toUpperCase()}`;

        const ownerNumber = process.env.OWNER_NUMBER || "917659989336";
        const encodedMessage = encodeURIComponent(finalWhatsappText);
        const redirectUrl = `https://wa.me/${ownerNumber}?text=${encodedMessage}`;

        // Deduct Wallet Balance if used
        if (body.walletUsed && body.userId) {
            await User.findByIdAndUpdate(body.userId, {
                $inc: { walletBalance: -body.walletUsed }
            });
        }

        return NextResponse.json({ success: true, data: order, redirectUrl });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to place order" },
            { status: 400 }
        );
    }
}

export async function GET(req: Request) {
    try {
        await connectToDatabase();

        const auth = await requireUser();
        if ("response" in auth) return auth.response;

        // Parse URL to check for userId query
        const { searchParams } = new URL(req.url);
        const userIdParam = searchParams.get("userId");

        const isAdmin = auth.session.user.role === "admin";
        const sessionUserId = auth.session.user.id;

        let query: Record<string, any> = {};
        if (isAdmin) {
            // Admin can query any user's orders or all orders
            query = userIdParam ? { userId: userIdParam } : {};
        } else {
            // Non-admin can only query their own orders
            query = { userId: sessionUserId };
            if (userIdParam && userIdParam !== sessionUserId) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: orders }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch orders" },
            { status: 400 }
        );
    }
}

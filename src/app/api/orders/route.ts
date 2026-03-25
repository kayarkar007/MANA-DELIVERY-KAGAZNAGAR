import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import { requireUser } from "@/lib/routeAuth";
import { hydrateOrderItemImages } from "@/lib/orderData";
import Order from "@/models/Order";
import Product from "@/models/Product";
import PromoCode from "@/models/PromoCode";
import User from "@/models/User";

function formatCurrency(value: number) {
    return `Rs ${value.toFixed(2)}`;
}

async function validatePromoCode(code: string | undefined, subtotal: number) {
    if (!code) {
        return { promo: null, discountAmount: 0 };
    }

    const promo = await PromoCode.findOne({
        code: code.toUpperCase(),
        isActive: true,
    });

    if (!promo) {
        throw new Error("Invalid or inactive promo code");
    }

    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
        throw new Error("Promo code has expired");
    }

    if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
        throw new Error("Promo code usage limit reached");
    }

    if (subtotal < promo.minOrderAmount) {
        throw new Error(`Minimum order amount of ${formatCurrency(promo.minOrderAmount)} required`);
    }

    let discountAmount = 0;
    if (promo.discountType === "fixed") {
        discountAmount = promo.discountValue;
    } else {
        discountAmount = (subtotal * promo.discountValue) / 100;
    }

    return {
        promo,
        discountAmount: Math.min(Number(discountAmount.toFixed(2)), subtotal),
    };
}

export async function POST(request: Request) {
    try {
        await connectToDatabase();

        const body = await request.json();
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;

        const type = body.type;
        const customerName = `${body.customerName || ""}`.trim();
        const customerPhone = `${body.customerPhone || ""}`.trim();
        const address = `${body.address || ""}`.trim();
        const latitude = Number(body.latitude);
        const longitude = Number(body.longitude);
        const tipAmount = Math.max(0, Number(body.tipAmount) || 0);

        if (!type || !customerName || !customerPhone || !address || Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return NextResponse.json({ success: false, error: "Missing required order details" }, { status: 400 });
        }

        const deliveryFee = 30;
        const platformFee = 5;

        let subtotal = 0;
        let tax = 0;
        let normalizedItems: Array<Record<string, any>> = [];
        let serviceCategory = body.serviceCategory;
        let serviceDetails = body.serviceDetails;

        if (type === "product") {
            const requestedItems = Array.isArray(body.items) ? body.items : [];
            if (requestedItems.length === 0) {
                return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
            }

            const productIds = requestedItems
                .map((item: any) => `${item?.productId || ""}`.trim())
                .filter(Boolean);

            if (productIds.length !== requestedItems.length) {
                return NextResponse.json({ success: false, error: "Invalid cart items" }, { status: 400 });
            }

            const products = await Product.find({ _id: { $in: productIds } })
                .select("_id name price image")
                .lean();

            const productMap = new Map(
                products.map((product: any) => [product._id.toString(), product])
            );

            normalizedItems = requestedItems.map((item: any) => {
                const productId = `${item.productId}`.trim();
                const product = productMap.get(productId);
                const quantity = Math.max(0, Number(item.quantity) || 0);

                if (!product || quantity < 1) {
                    throw new Error("One or more cart items are invalid or unavailable");
                }

                return {
                    productId,
                    name: product.name,
                    price: Number(product.price),
                    quantity,
                    image: product.image || undefined,
                };
            });

            subtotal = normalizedItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
        } else if (type === "service") {
            if (serviceCategory === "Petrol Delivery") {
                subtotal = (Number(serviceDetails?.quantity) || 1) * 105;
            } else if (serviceCategory === "Pickup & Drop") {
                subtotal = 150;
            } else {
                subtotal = 200;
            }
        } else {
            return NextResponse.json({ success: false, error: "Invalid order type" }, { status: 400 });
        }

        tax = Number((subtotal * 0.05).toFixed(2));

        const promoResult = await validatePromoCode(body.promoCode, subtotal);
        const grossTotal = subtotal + deliveryFee + platformFee + tax + tipAmount;

        let walletUsed = 0;
        if (userId && Number(body.walletUsed) > 0) {
            const user = await User.findById(userId).select("walletBalance");
            if (user) {
                walletUsed = Math.min(
                    Number(body.walletUsed),
                    Number(user.walletBalance) || 0,
                    Math.max(0, grossTotal - promoResult.discountAmount)
                );
            }
        }

        const total = Number(
            Math.max(0, grossTotal - promoResult.discountAmount - walletUsed).toFixed(2)
        );

        const paymentMethod = total === 0 ? "wallet" : (body.paymentMethod || "cod");
        const transactionId = `${body.transactionId || ""}`.trim();

        if (paymentMethod === "upi" && total > 0 && !transactionId) {
            return NextResponse.json({ success: false, error: "UPI transaction ID is required" }, { status: 400 });
        }

        const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

        const order = await Order.create({
            type,
            userId,
            items: normalizedItems,
            serviceCategory,
            serviceDetails,
            status: "pending",
            subtotal,
            deliveryFee,
            platformFee,
            tax,
            discountAmount: promoResult.discountAmount,
            promoCode: promoResult.promo?.code,
            walletUsed,
            total,
            tipAmount,
            paymentMethod,
            transactionId: transactionId || undefined,
            customerName,
            customerPhone,
            address,
            latitude,
            longitude,
            deliveryStatus: "pending",
            deliveryOtp,
        });

        if (walletUsed > 0 && userId) {
            await User.findByIdAndUpdate(userId, {
                $inc: { walletBalance: -walletUsed },
            });
        }

        if (promoResult.promo && promoResult.discountAmount > 0) {
            await PromoCode.findByIdAndUpdate(promoResult.promo._id, {
                $inc: { usedCount: 1 },
            });
        }

        let whatsappText = "";

        if (type === "product") {
            whatsappText = `New Product Order:
--------------------------------
${normalizedItems.map((item) => `${item.name} x ${item.quantity} = ${formatCurrency(item.price * item.quantity)}`).join("\n")}
--------------------------------
Subtotal: ${formatCurrency(subtotal)}
Delivery Fee: ${formatCurrency(deliveryFee)}
Platform Fee: ${formatCurrency(platformFee)}
Tax: ${formatCurrency(tax)}
${promoResult.discountAmount ? `Discount (-): ${formatCurrency(promoResult.discountAmount)}\n` : ""}${walletUsed ? `Wallet Applied (-): ${formatCurrency(walletUsed)}\n` : ""}${tipAmount ? `Rider Tip (+): ${formatCurrency(tipAmount)}\n` : ""}Total: ${formatCurrency(total)}
--------------------------------
Customer: ${customerName}
Phone: ${customerPhone}
Address: ${address}
Google Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
        } else {
            const detailsText = Object.entries(serviceDetails || {})
                .map(([key, value]) => `${key}: ${value}`)
                .join("\n");

            whatsappText = `New Service Request:
--------------------------------
Service Type: ${serviceCategory}
Details:
${detailsText}
--------------------------------
Estimated Price: ${formatCurrency(total)}
${tipAmount ? `Rider Tip (+): ${formatCurrency(tipAmount)}\n` : ""}--------------------------------
Customer: ${customerName}
Phone: ${customerPhone}
Address: ${address}
Google Maps: https://www.google.com/maps?q=${latitude},${longitude}`;
        }

        const finalWhatsappText = `${whatsappText}
--------------------------------
Payment: ${paymentMethod.toUpperCase()}
${transactionId ? `Txn ID: ${transactionId}\n` : ""}--------------------------------
Order Tracking ID: #${order._id.toString().slice(-6).toUpperCase()}`;

        const ownerNumber = process.env.OWNER_NUMBER || "917659989336";
        const redirectUrl = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(finalWhatsappText)}`;

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

        const { searchParams } = new URL(req.url);
        const userIdParam = searchParams.get("userId");

        const isAdmin = auth.session.user.role === "admin";
        const sessionUserId = auth.session.user.id;

        let query: Record<string, any> = {};
        if (isAdmin) {
            query = userIdParam ? { userId: userIdParam } : {};
        } else {
            query = { userId: sessionUserId };
            if (userIdParam && userIdParam !== sessionUserId) {
                return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
            }
        }

        const orders = await Order.find(query).sort({ createdAt: -1 });
        const hydratedOrders = await hydrateOrderItemImages(orders);

        return NextResponse.json({ success: true, data: hydratedOrders }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch orders" },
            { status: 400 }
        );
    }
}


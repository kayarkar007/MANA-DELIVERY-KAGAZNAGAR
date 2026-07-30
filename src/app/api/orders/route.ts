import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";
import { requireUser } from "@/lib/routeAuth";
import { hydrateOrderItemImages } from "@/lib/orderData";
import { triggerNotification, notifyAdmins } from "@/lib/notifications";
import { buildOrderHistoryEntry } from "@/lib/orderHistory";
import { getInventoryItems, reserveInventory, restoreInventory, type InventoryItem } from "@/lib/inventory";
import { createWalletTransaction } from "@/lib/wallet";
import { orderLimiter } from "@/lib/rateLimit";
import Order from "@/models/Order";
import Product from "@/models/Product";
import PromoCode from "@/models/PromoCode";
import User from "@/models/User";
import { sendEmail } from "@/lib/mailer";
import { orderConfirmationEmail } from "@/lib/emailTemplates";
import { sendOrderStatusSMS } from "@/lib/sms";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { isWithinServiceZone, isKagaznagarAddress, KAGAZNAGAR_CENTER } from "@/lib/geolocation";


function formatCurrency(value: number) {
    return `₹${value.toFixed(2)}`;
}

function getInitialPaymentStatus(paymentMethod: string, total: number) {
    if (paymentMethod === "cod") {
        return "cod_pending";
    }

    if (paymentMethod === "wallet" && total === 0) {
        return "verified";
    }

    return "pending";
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
    let reservedInventory: InventoryItem[] = [];

    try {
        const auth = await requireUser();
        if ("response" in auth) return auth.response;

        const userId = auth.session.user.id;

        // ── Rate limit: 20 orders per user per 10 minutes ────────────────────
        if (!orderLimiter.check(userId)) {
            return NextResponse.json(
                { success: false, error: "Too many order requests. Please wait a moment before trying again." },
                { status: 429 }
            );
        }

        await connectToDatabase();

        const body = await request.json();

        const type = body.type;
        const customerName = `${body.customerName || ""}`.trim();
        const customerPhone = `${body.customerPhone || ""}`.trim();
        const address = `${body.address || body.deliveryAddress || ""}`.trim();
        const deliveryAddress = address;
        let latitude = Number(body.latitude);
        let longitude = Number(body.longitude);
        const requestedTipAmount = Number(body.tipAmount ?? 0);

        if (!type || !customerName || !customerPhone || !address) {

            return NextResponse.json({ success: false, error: "Missing required order details (name, phone, delivery address)" }, { status: 400 });
        }

        // If coordinates missing or zero, fallback to Kagaznagar center if address matches Kagaznagar keywords
        if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
            if (isKagaznagarAddress(deliveryAddress)) {
                latitude = KAGAZNAGAR_CENTER.latitude;
                longitude = KAGAZNAGAR_CENTER.longitude;
            } else {
                return NextResponse.json({
                    success: false,
                    error: "Delivery is currently restricted to Kagaznagar & surrounding 15 km area. Please enter a valid Kagaznagar delivery address."
                }, { status: 400 });
            }
        }

        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return NextResponse.json({ success: false, error: "Invalid delivery coordinates" }, { status: 400 });
        }

        // ── Geofencing check: 15 km service radius around Sirpur Kagaznagar ────
        const geoCheck = isWithinServiceZone(latitude, longitude);
        if (!geoCheck.serviceable) {
            return NextResponse.json({
                success: false,
                error: `Sorry, delivery location is ${geoCheck.distanceKm} km away. Mana Delivery currently serves within ${geoCheck.maxRadiusKm} km of Sirpur Kagaznagar.`
            }, { status: 400 });
        }


        if (!Number.isFinite(requestedTipAmount) || requestedTipAmount < 0 || requestedTipAmount > 10000) {
            return NextResponse.json({ success: false, error: "Invalid tip amount" }, { status: 400 });
        }

        const tipAmount = Number(requestedTipAmount.toFixed(2));

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

            if (requestedItems.length > 100) {
                return NextResponse.json({ success: false, error: "Cart contains too many items" }, { status: 400 });
            }

            const productIds = requestedItems
                .map((item: any) => `${item?.productId || ""}`.trim())
                .filter(Boolean);

            if (productIds.length !== requestedItems.length) {
                return NextResponse.json({ success: false, error: "Invalid cart items" }, { status: 400 });
            }

            const products = await Product.find({ 
                _id: { $in: productIds },
                isHidden: { $ne: true }
            })
                .select("_id name price image stockQuantity")
                .lean();

            const productMap = new Map(
                products.map((product: any) => [product._id.toString(), product])
            );

            normalizedItems = requestedItems.map((item: any) => {
                const productId = `${item.productId}`.trim();
                const product = productMap.get(productId);
                const quantity = Number(item.quantity);

                if (!product || !Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
                    throw new Error("Some items in your cart are no longer available for purchase. Please review your cart.");
                }

                if ((Number(product.stockQuantity) || 0) < quantity) {
                    throw new Error(`${product.name} is out of stock for the requested quantity`);
                }

                return {
                    productId,
                    name: product.name,
                    price: Number(product.price),
                    quantity,
                    image: product.image || undefined,
                    shop: item.shop ? {
                        shopId: item.shop.shopId,
                        name: item.shop.name,
                        image: item.shop.image,
                    } : undefined,
                };
            });

            subtotal = normalizedItems.reduce(
                (sum, item) => sum + item.price * item.quantity,
                0
            );
        } else if (type === "service") {
            // Sanitize serviceDetails — only allow known safe string/number keys
            // to prevent arbitrary data injection into the Mixed schema field.
            const ALLOWED_SERVICE_KEYS = new Set([
                "description", "quantity", "weight", "from", "to",
                "pickupAddress", "dropAddress", "notes", "preferredTime",
                "item", "itemDescription", "liters", "vehicleType",
            ]);
            if (serviceDetails && typeof serviceDetails === "object") {
                serviceDetails = Object.fromEntries(
                    Object.entries(serviceDetails)
                        .filter(([key]) => ALLOWED_SERVICE_KEYS.has(key))
                        .map(([key, value]) => [
                            key,
                            typeof value === "string"
                                ? `${value}`.slice(0, 500)          // cap string length
                                : typeof value === "number"
                                    ? Number(value)                 // keep numbers
                                    : String(value).slice(0, 500),  // coerce rest to string
                        ])
                );
            } else {
                serviceDetails = {};
            }

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

        const requestedPaymentMethod = `${body.paymentMethod || "cod"}`.toLowerCase();
        const allowedPaymentMethods = new Set(["cod", "upi", "razorpay"]);

        if (total > 0 && !allowedPaymentMethods.has(requestedPaymentMethod)) {
            return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
        }

        const paymentMethod = total === 0 ? "wallet" : requestedPaymentMethod;
        const transactionId = `${body.transactionId || ""}`.trim();

        if (paymentMethod === "upi" && total > 0 && !transactionId) {
            return NextResponse.json({ success: false, error: "UPI transaction ID is required" }, { status: 400 });
        }

        reservedInventory = type === "product" ? getInventoryItems(normalizedItems) : [];
        const mongoSession = await mongoose.startSession();
        let orderObj: any;

        try {
            mongoSession.startTransaction();

            if (reservedInventory.length > 0) {
                await reserveInventory(reservedInventory, mongoSession);
            }

            const deliveryOtp = Math.floor(1000 + Math.random() * 9000).toString();

            const order = await Order.create([{
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
                paymentStatus: getInitialPaymentStatus(paymentMethod, total),
                transactionId: transactionId || undefined,
                customerName,
                customerPhone,
                address: deliveryAddress,
                latitude,
                longitude,
                deliveryStatus: "pending",
                statusHistory: [
                    buildOrderHistoryEntry({
                        status: "pending",
                        deliveryStatus: "pending",
                        label: "Order placed",
                        note: type === "product" ? "Customer created a product order" : "Customer created a service request",
                        actorRole: userId ? "user" : "guest",
                        actorId: userId,
                    }),
                ],
                deliveryOtp,
            }], { session: mongoSession });

            orderObj = order[0];

            if (walletUsed > 0 && userId) {
                await createWalletTransaction({
                    userId,
                    amount: walletUsed,
                    type: "debit",
                    source: "order_payment",
                    note: `Wallet applied to order #${orderObj._id.toString().slice(-6).toUpperCase()}`,
                    orderId: orderObj._id.toString(),
                }, mongoSession);
            }

            if (promoResult.promo && promoResult.discountAmount > 0) {
                // Atomic promo increment — guards against race conditions where
                // two concurrent requests both pass the usage-limit check
                const updatedPromo = await PromoCode.findOneAndUpdate(
                    {
                        _id: promoResult.promo._id,
                        $or: [
                            { usageLimit: null },
                            { usageLimit: { $exists: false } },
                            { $expr: { $lt: ["$usedCount", "$usageLimit"] } },
                        ],
                    },
                    { $inc: { usedCount: 1 } },
                    { session: mongoSession }
                );
                if (!updatedPromo) {
                    throw new Error("Promo code usage limit has been reached. Please remove it and try again.");
                }
            }

            await mongoSession.commitTransaction();
        } catch (txnError) {
            await mongoSession.abortTransaction();
            throw txnError;
        } finally {
            mongoSession.endSession();
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
Order Tracking ID: #${orderObj._id.toString().slice(-6).toUpperCase()}`;

        const ownerNumber = process.env.OWNER_NUMBER || "917659989336";
        const redirectUrl = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(finalWhatsappText)}`;

        if (userId) {
            await triggerNotification({
                recipientId: userId,
                recipientRole: "user",
                title: "Order Placed",
                message: `Your order #${orderObj._id.toString().slice(-6).toUpperCase()} was placed successfully`,
                type: "order",
                href: "/profile",
                metadata: { orderId: orderObj._id.toString() },
            });

            // Send Order Confirmation Email (Non-blocking)
            (async () => {
                try {
                    const user = await User.findById(userId).select("email").lean() as any;
                    if (user?.email) {
                        const shortId = orderObj._id.toString().slice(-6).toUpperCase();
                        const html = orderConfirmationEmail({
                            customerName,
                            orderId: shortId,
                            orderTotal: total,
                            paymentMethod,
                            deliveryAddress: address,
                            items: (normalizedItems || []).map((i: any) => ({
                                name: i.name,
                                quantity: i.quantity,
                                price: i.price,
                            })),
                            promoDiscount: promoResult.discountAmount,
                            walletUsed,
                            tipAmount,
                            deliveryFee,
                            platformFee,
                            tax,
                            subtotal,
                            type,
                            serviceCategory,
                        });
                        await sendEmail(user.email, `Order Confirmed #${shortId} – Mana Delivery`, html);
                    }
                } catch (emailErr: any) {
                    console.warn("⚠️ Order confirmation email failed (non-fatal):", emailErr.message);
                }
            })();
        }

        // Non-blocking SMS & WhatsApp notifications
        (async () => {
            try {
                const shortId = orderObj._id.toString().slice(-6).toUpperCase();
                if (customerPhone) {
                    await sendOrderStatusSMS(customerPhone, shortId, "pending");
                    await sendWhatsAppMessage({
                        toPhone: customerPhone,
                        customerName,
                        orderShortId: shortId,
                        status: "placed",
                        totalAmount: total,
                        lang: "te",
                    });
                }
            } catch (err: any) {
                console.warn("⚠️ Order SMS/WhatsApp alert failed (non-fatal):", err.message);
            }
        })();

        await notifyAdmins({
            title: "New Order",
            message: `${customerName} placed order #${orderObj._id.toString().slice(-6).toUpperCase()}`,
            type: "order",
            href: "/admin/orders",
            metadata: { orderId: orderObj._id.toString(), type },
        });

        return NextResponse.json({ success: true, data: orderObj, redirectUrl });
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

        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
        const status = searchParams.get("status");
        const refundStatus = searchParams.get("refundStatus");
        const paymentStatus = searchParams.get("paymentStatus");
        const search = `${searchParams.get("search") || ""}`.trim();

        if (status) {
            query.status = status;
        }
        if (refundStatus) {
            query.refundStatus = refundStatus;
        }
        if (paymentStatus) {
            query.paymentStatus = paymentStatus;
        }
        if (search) {
            query.$or = [
                { customerName: { $regex: search, $options: "i" } },
                { customerPhone: { $regex: search, $options: "i" } },
                { address: { $regex: search, $options: "i" } },
                { transactionId: { $regex: search, $options: "i" } },
                { promoCode: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const hydratedOrders = await hydrateOrderItemImages(orders);

        return NextResponse.json({
            success: true,
            data: hydratedOrders,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: "Failed to fetch orders" },
            { status: 400 }
        );
    }
}


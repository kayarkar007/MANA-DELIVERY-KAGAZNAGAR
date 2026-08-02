import { NextResponse } from "next/server";
import { requireUserFlexible } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import Order from "@/models/Order";
import WalletTransaction from "@/models/WalletTransaction";
import Wishlist from "@/models/Wishlist";
import Review from "@/models/Review";
import SupportTicket from "@/models/SupportTicket";
import Notification from "@/models/Notification";
import PushSubscription from "@/models/PushSubscription";

export async function GET() {
    const auth = await requireUserFlexible();
    if ("response" in auth) return auth.response;

    const userId = auth.session.user.id;
    if (!userId || auth.session.user.role !== "user") {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const user = await User.findById(userId)
        .select("name email phone whatsapp address savedAddresses isVerified isPhoneVerified privacyPolicyVersion privacyPolicyAcceptedAt termsVersion termsAcceptedAt marketingConsent marketingConsentUpdatedAt privacyErasedAt createdAt updatedAt")
        .lean();

    if (!user || user.privacyErasedAt) {
        return NextResponse.json({ success: false, error: "Account unavailable" }, { status: 404 });
    }

    const [orders, walletTransactions, wishlist, reviews, supportTickets, notifications, pushSubscriptions] = await Promise.all([
        Order.find({ userId }).select("-deliveryOtp -deliveryOtpHash -deliveryOtpExpiresAt -deliveryOtpAttempts").lean(),
        WalletTransaction.find({ userId }).lean(),
        Wishlist.findOne({ userId }).lean(),
        Review.find({ userId }).lean(),
        SupportTicket.find({ userId }).lean(),
        Notification.find({ recipientId: userId, recipientRole: "user" }).lean(),
        PushSubscription.find({ userId }).lean(),
    ]);

    const exportedAt = new Date();
    const payload = {
        exportVersion: 1,
        exportedAt: exportedAt.toISOString(),
        account: user,
        orders,
        walletTransactions,
        wishlist,
        reviews,
        supportTickets,
        notifications,
        pushSubscriptions,
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Content-Disposition": `attachment; filename="mana-delivery-data-export-${exportedAt.toISOString().slice(0, 10)}.json"`,
            "Cache-Control": "no-store, max-age=0",
        },
    });
}

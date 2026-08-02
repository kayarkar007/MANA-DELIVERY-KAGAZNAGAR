import { NextResponse } from "next/server";
import { requireUserFlexible } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import { ACCOUNT_DELETION_CONFIRMATION } from "@/lib/privacy";
import { getRequestId, logError, logInfo } from "@/lib/observability";
import User from "@/models/User";
import Order from "@/models/Order";
import Wishlist from "@/models/Wishlist";
import Review from "@/models/Review";
import SupportTicket from "@/models/SupportTicket";
import Notification from "@/models/Notification";
import PushSubscription from "@/models/PushSubscription";

export async function POST(request: Request) {
    const requestId = getRequestId(request);
    const auth = await requireUserFlexible();
    if ("response" in auth) return auth.response;

    const userId = auth.session.user.id;
    if (!userId || auth.session.user.role !== "user") {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let body: { confirmation?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    if (body.confirmation !== ACCOUNT_DELETION_CONFIRMATION) {
        return NextResponse.json(
            { success: false, error: `Type ${ACCOUNT_DELETION_CONFIRMATION} to confirm account deletion.` },
            { status: 400 }
        );
    }

    try {
        await connectToDatabase();
        const user = await User.findById(userId).select("privacyErasedAt").lean();
        if (!user || user.privacyErasedAt) {
            return NextResponse.json({ success: false, error: "Account unavailable" }, { status: 404 });
        }

        const activeOrder = await Order.exists({
            userId,
            status: { $nin: ["delivered", "cancelled"] },
        });
        if (activeOrder) {
            return NextResponse.json(
                { success: false, error: "Complete or cancel all active orders before deleting your account." },
                { status: 409 }
            );
        }

        const erasedAt = new Date();
        await Promise.all([
            Order.updateMany(
                { userId },
                {
                    $set: {
                        customerName: "Deleted customer",
                        customerPhone: "",
                        address: "",
                        latitude: 0,
                        longitude: 0,
                    },
                    $unset: { userId: "", deliveryOtp: "", deliveryOtpHash: "", deliveryOtpExpiresAt: "", deliveryOtpAttempts: "" },
                }
            ),
            Wishlist.deleteMany({ userId }),
            Review.deleteMany({ userId }),
            SupportTicket.updateMany(
                { userId },
                {
                    $set: { customerName: "Deleted customer", customerPhone: "", message: "[Removed after account deletion]" },
                    $unset: { userId: "" },
                }
            ),
            Notification.deleteMany({ recipientId: userId, recipientRole: "user" }),
            PushSubscription.deleteMany({ userId }),
        ]);

        await User.updateOne(
            { _id: userId, privacyErasedAt: { $exists: false } },
            {
                $set: {
                    name: "Deleted user",
                    role: "user",
                    isVerified: false,
                    isPhoneVerified: false,
                    isOnDuty: false,
                    dutyStatus: "offline",
                    walletBalance: 0,
                    savedAddresses: [],
                    marketingConsent: false,
                    marketingConsentUpdatedAt: erasedAt,
                    privacyErasedAt: erasedAt,
                },
                $unset: {
                    email: "", password: "", phone: "", phoneOtp: "", phoneOtpExpiry: "", fcmToken: "", whatsapp: "", address: "",
                    currentLocation: "", currentShiftStartedAt: "", lastShiftEndedAt: "", currentBreakStartedAt: "", verifyOtp: "", verifyOtpExpiry: "", resetToken: "",
                },
            }
        );

        logInfo("privacy.account_deleted", { requestId, userId });
        return NextResponse.json({ success: true, signOutRequired: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        logError("privacy.account_deletion_failed", error, { requestId, userId });
        return NextResponse.json({ success: false, error: "Unable to delete the account. Please try again later." }, { status: 500 });
    }
}

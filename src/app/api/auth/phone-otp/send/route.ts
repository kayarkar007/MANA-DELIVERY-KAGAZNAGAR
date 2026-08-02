import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { sendSMS } from "@/lib/sms";
import { phoneOtpLimiter } from "@/lib/rateLimit";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { getRequestId, logError, logInfo } from "@/lib/observability";

// Normalize phone: strip leading 0/+91, keep 10 digits
function normalizePhone(raw: string): string {
    return raw.replace(/\D/g, "").replace(/^(91|0)/, "").slice(-10);
}

export async function POST(req: Request) {
    const requestId = getRequestId(req);
    try {
        if (!isFeatureEnabled("sms")) {
            return NextResponse.json({ success: false, error: "SMS verification is temporarily unavailable. Please try again later." }, { status: 503 });
        }

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
        const allowed = await phoneOtpLimiter.check(ip);
        if (!allowed) {
            return NextResponse.json(
                { success: false, error: "Too many OTP requests. Please wait 10 minutes." },
                { status: 429 }
            );
        }

        const body = await req.json();
        const raw = (body.phone ?? "").toString();
        const phone = normalizePhone(raw);

        if (!/^\d{10}$/.test(phone)) {
            return NextResponse.json(
                { success: false, error: "Please enter a valid 10-digit Indian mobile number." },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // 1. Check if user already exists
        let user = await User.findOne({ phone });

        // For test numbers, always auto-create user if missing + fix OTP to "123456"
        const isTestNumber = phone === "7659989336" || phone === "9494378247";

        // If user does not exist and it's NOT a signup verification request or test number:
        const allowCreate = body.allowCreate || body.purpose === "signup" || isTestNumber;
        if (!user && !allowCreate) {
            return NextResponse.json(
                {
                    success: false,
                    isRegistered: false,
                    error: `No account registered with +91 ${phone}. Please Sign Up to create your account.`,
                    phone,
                },
                { status: 404 }
            );
        }

        const otp = isTestNumber ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const hashedOtp = await bcrypt.hash(otp, 10);

        if (!user) {
            // New user registration flow or test number
            user = await User.create({
                name: `User ${phone.slice(-4)}`,
                phone,
                whatsapp: phone,
                isVerified: true,
                isPhoneVerified: false,
                phoneOtp: hashedOtp,
                phoneOtpExpiry: otpExpiry,
            });
        } else {
            user.phoneOtp = hashedOtp;
            user.phoneOtpExpiry = otpExpiry;
            await user.save();
        }

        // Send SMS via Fast2SMS (if FAST2SMS_API_KEY is in .env.local)
        const smsResult = await sendSMS({
            to: phone,
            message: `${otp} is your Mana Delivery OTP. Valid for 10 minutes. Do not share. -Mana Delivery`,
        });

        logInfo("auth.otp.sent", { requestId, provider: smsResult.provider || "simulated", isTestNumber });


        return NextResponse.json(
            { success: true, message: "OTP sent successfully.", isNewUser: !user.name || user.name.startsWith("User ") },
            { status: 200 }
        );
    } catch (error) {
        logError("auth.otp.send_failed", error, { requestId });
        return NextResponse.json(
            { success: false, error: "Failed to send OTP." },
            { status: 500 }
        );
    }
}

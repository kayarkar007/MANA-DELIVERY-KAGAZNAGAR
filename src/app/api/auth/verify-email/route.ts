import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// In-memory OTP brute-force protection (5 attempts → 15 min lockout)
const otpAttempts = new Map<string, { count: number; lockedUntil?: number }>();

function checkOtpRateLimit(email: string): { allowed: boolean; message?: string } {
    const now = Date.now();
    const key = email.toLowerCase();
    const record = otpAttempts.get(key) || { count: 0 };

    if (record.lockedUntil && now < record.lockedUntil) {
        const mins = Math.ceil((record.lockedUntil - now) / 60000);
        return { allowed: false, message: `Too many attempts. Try again in ${mins} minute(s).` };
    }

    // Reset expired lockout
    if (record.lockedUntil && now >= record.lockedUntil) {
        otpAttempts.set(key, { count: 1 });
        return { allowed: true };
    }

    const newCount = record.count + 1;
    if (newCount > 5) {
        otpAttempts.set(key, { count: newCount, lockedUntil: now + 15 * 60 * 1000 });
        return { allowed: false, message: "Too many failed attempts. Account locked for 15 minutes." };
    }

    otpAttempts.set(key, { count: newCount });
    return { allowed: true };
}

function clearOtpAttempts(email: string) {
    otpAttempts.delete(email.toLowerCase());
}


export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ success: false, error: "Email and OTP are required" }, { status: 400 });
        }

        // Rate limit check BEFORE DB lookup to prevent enumeration + brute force
        const rateLimit = checkOtpRateLimit(email);
        if (!rateLimit.allowed) {
            return NextResponse.json({ success: false, error: rateLimit.message }, { status: 429 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ success: false, error: "Invalid or expired verification code" }, { status: 400 });
        }

        if (user.isVerified) {
            clearOtpAttempts(email);
            return NextResponse.json({ success: false, error: "User is already verified" }, { status: 400 });
        }

        // SECURITY: OTP is stored as a bcrypt hash — compare with bcrypt, not ===
        const otpValid = user.verifyOtp ? await bcrypt.compare(otp, user.verifyOtp) : false;
        if (!otpValid) {
            return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 });
        }

        if (new Date() > new Date(user.verifyOtpExpiry)) {
            return NextResponse.json({ success: false, error: "Verification code has expired. Please request a new one." }, { status: 400 });
        }

        // Mark as verified and clear OTP fields
        user.isVerified = true;
        user.verifyOtp = undefined;
        user.verifyOtpExpiry = undefined;
        await user.save();

        // Clear rate limit on successful verification
        clearOtpAttempts(email);

        return NextResponse.json({ success: true, message: "Email verified successfully!" }, { status: 200 });


    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to verify email." },
            { status: 500 }
        );
    }
}

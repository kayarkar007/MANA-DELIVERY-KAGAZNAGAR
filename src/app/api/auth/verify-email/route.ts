import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ success: false, error: "Email and OTP are required" }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        if (user.isVerified) {
            return NextResponse.json({ success: false, error: "User is already verified" }, { status: 400 });
        }

        if (user.verifyOtp !== otp) {
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

        return NextResponse.json({ success: true, message: "Email verified successfully!" }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to verify email." },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { token, email, newPassword } = await req.json();

        if (!token || !email || !newPassword) {
            return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
        }

        // Validate Password Strength
        const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(newPassword);
        if (!isStrong) {
            return NextResponse.json({ success: false, error: "New password does not meet security requirements." }, { status: 400 });
        }

        const user = await User.findOne({ 
            email, 
            resetToken: token,
            resetTokenExpiry: { $gt: new Date() } // Must not be expired
        });

        if (!user) {
            return NextResponse.json({ success: false, error: "Invalid or expired reset token." }, { status: 400 });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update User
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        return NextResponse.json({ success: true, message: "Password has been reset successfully." }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to reset password." },
            { status: 500 }
        );
    }
}

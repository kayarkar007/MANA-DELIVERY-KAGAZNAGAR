import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import { sendEmail } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            // We still return success to prevent email enumeration attacks
            return NextResponse.json({ success: true, message: "If that email exists, a reset link has been sent." }, { status: 200 });
        }

        // Generate a secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

        user.resetToken = resetToken;
        user.resetTokenExpiry = resetTokenExpiry;
        await user.save();

        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Password Reset Request</h2>
                <p>Hi ${user.name},</p>
                <p>You recently requested to reset your password for your Mana Delivery account. Click the button below to reset it:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #6b7280; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:<br/>${resetLink}</p>
                <p>This link will expire in 30 minutes. If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
                <p>Best regards,<br/>The Mana Delivery Team</p>
            </div>
        `;
        
        await sendEmail(email, "Reset your Mana Delivery Password", html);

        return NextResponse.json({ success: true, message: "If that email exists, a reset link has been sent." }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to process request." },
            { status: 500 }
        );
    }
}

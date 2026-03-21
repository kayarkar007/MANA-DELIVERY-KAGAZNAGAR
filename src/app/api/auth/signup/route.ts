import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { name, email, password, whatsapp } = await req.json();

        // 1. Validate Password Strength (Backend validation)
        const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password);
        if (!isStrong) {
            return NextResponse.json(
                { success: false, error: "Password does not meet security requirements." },
                { status: 400 }
            );
        }

        // 2. Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { success: false, error: "User already exists with this email." },
                { status: 400 }
            );
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // 5. Build User - Unverified
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            whatsapp,
            isVerified: false,
            verifyOtp: otp,
            verifyOtpExpiry: otpExpiry
        });

        // 6. Send OTP Email
        const html = `
            <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #2563eb;">Welcome to LocalU Delivery!</h2>
                <p>Hi ${name},</p>
                <p>Thank you for signing up. To complete your registration and secure your account, please use the verification code below:</p>
                <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <h1 style="letter-spacing: 5px; color: #1f2937; margin: 0;">${otp}</h1>
                </div>
                <p>This code will expire in 10 minutes.</p>
                <p>If you did not create this account, please ignore this email.</p>
                <p>Best regards,<br/>The LocalU Team</p>
            </div>
        `;
        
        // We do not await this heavily or block if email fails, but it's good to try
        await sendEmail(email, "Verify your LocalU Account", html);

        return NextResponse.json(
            { success: true, message: "User registered successfully! Please verify OTP.", email },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to register user." },
            { status: 500 }
        );
    }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

/**
 * POST /api/auth/mobile-login
 *
 * Mobile-specific JWT authentication endpoint.
 * Supports:
 *   1. Email + Password login
 *   2. Phone login (after OTP already verified — passes userId)
 *
 * Returns a 30-day JWT token for use in mobile apps (Authorization: Bearer <token>).
 * Does NOT affect web app auth (which uses NextAuth cookie sessions).
 *
 * Request body:
 *   { loginType: "email", email: string, password: string, expectedRole?: string }
 *   { loginType: "phone", userId: string, phone: string, expectedRole?: string }
 */
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { loginType, email, password, userId, phone, expectedRole } = body;

        if (!loginType || !["email", "phone"].includes(loginType)) {
            return NextResponse.json(
                { success: false, error: "loginType must be 'email' or 'phone'" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        let user: any = null;

        // ── Email + Password Login ─────────────────────────────────────────────
        if (loginType === "email") {
            if (!email || !password) {
                return NextResponse.json(
                    { success: false, error: "email and password are required" },
                    { status: 400 }
                );
            }

            user = await User.findOne({ email: email.toLowerCase().trim() }).lean();

            if (!user) {
                return NextResponse.json(
                    { success: false, error: "No account found with this email." },
                    { status: 401 }
                );
            }

            if (!user.password) {
                return NextResponse.json(
                    { success: false, error: "This account uses Google login. Please sign in via web." },
                    { status: 401 }
                );
            }

            const passwordValid = await bcrypt.compare(password, user.password);
            if (!passwordValid) {
                return NextResponse.json(
                    { success: false, error: "Incorrect password." },
                    { status: 401 }
                );
            }

            if (!user.isVerified) {
                return NextResponse.json(
                    { success: false, error: "Please verify your email first." },
                    { status: 401 }
                );
            }
        }

        // ── Phone Login (after OTP verification) ──────────────────────────────
        if (loginType === "phone") {
            if (!userId || !phone) {
                return NextResponse.json(
                    { success: false, error: "userId and phone are required for phone login" },
                    { status: 400 }
                );
            }

            user = await User.findById(userId).lean();

            if (!user) {
                return NextResponse.json(
                    { success: false, error: "User not found." },
                    { status: 404 }
                );
            }

            const normalizedPhone = phone.replace(/\D/g, "").replace(/^(91|0)/, "").slice(-10);
            if (user.phone !== normalizedPhone || !user.isPhoneVerified) {
                return NextResponse.json(
                    { success: false, error: "Phone verification required." },
                    { status: 401 }
                );
            }
        }

        if (!user) {
            return NextResponse.json({ success: false, error: "Authentication failed." }, { status: 401 });
        }

        // ── Role Check — prevents rider logging into admin app, etc. ──────────
        if (expectedRole && user.role !== expectedRole && user.role !== "admin") {
            return NextResponse.json(
                {
                    success: false,
                    error: `Access denied. This app is for ${expectedRole}s only. Your role: ${user.role}.`,
                },
                { status: 403 }
            );
        }

        // ── Generate JWT Token (30 days) ───────────────────────────────────────
        const tokenPayload = {
            id: user._id.toString(),
            name: user.name,
            email: user.email ?? null,
            role: user.role,
            phone: user.phone ?? null,
            isPhoneVerified: user.isPhoneVerified ?? false,
            shopId: user.shopId?.toString() ?? null,
        };

        const token = jwt.sign(tokenPayload, process.env.NEXTAUTH_SECRET!, {
            expiresIn: "30d",
        });

        return NextResponse.json({
            success: true,
            token,
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email ?? null,
                role: user.role,
                phone: user.phone ?? null,
                isPhoneVerified: user.isPhoneVerified ?? false,
                shopId: user.shopId?.toString() ?? null,
                vendorStatus: user.vendorStatus ?? null,
                walletBalance: user.walletBalance ?? 0,
            },
        });
    } catch (error: any) {
        console.error("[mobile-login] Error:", error);
        return NextResponse.json(
            { success: false, error: "Authentication failed. Please try again." },
            { status: 500 }
        );
    }
}

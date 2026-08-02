import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { firebaseAdminApp } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";
import { createMobileAccessToken } from "@/lib/mobileAuth";

function normalizePhone(raw: string): string {
    return raw.replace(/\D/g, "").replace(/^(91|0)/, "").slice(-10);
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const rawPhone = (body.phone ?? "").toString();
        const phone = normalizePhone(rawPhone);
        const otp = (body.otp ?? "").toString().trim();
        const firebaseIdToken = body.firebaseIdToken;

        if (!/^\d{10}$/.test(phone)) {
            return NextResponse.json(
                { success: false, error: "Invalid 10-digit phone number." },
                { status: 400 }
            );
        }

        await connectToDatabase();
        let user = await User.findOne({ phone });

        // ── 1. Firebase Phone Auth Verification ─────────────────────────────────
        if (firebaseIdToken) {
            let verifiedPhone = "";
            let isVerified = false;

            if (firebaseAdminApp) {
                try {
                    const decodedToken = await getAuth(firebaseAdminApp).verifyIdToken(firebaseIdToken);
                    verifiedPhone = decodedToken.phone_number ? normalizePhone(decodedToken.phone_number) : "";
                    isVerified = true;
                } catch (err: any) {
                    console.warn("⚠️ Firebase Admin ID token verification failed, trying REST API:", err.message);
                }
            }

            // Fallback: Verify token via Firebase Identity Toolkit REST API (uses NEXT_PUBLIC_FIREBASE_API_KEY)
            if (!isVerified) {
                const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
                if (apiKey) {
                    try {
                        const restRes = await fetch(
                            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
                            {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ idToken: firebaseIdToken }),
                            }
                        );
                        const restData = await restRes.json();
                        if (restRes.ok && restData.users?.[0]?.phoneNumber) {
                            verifiedPhone = normalizePhone(restData.users[0].phoneNumber);
                            isVerified = true;
                        } else {
                            console.error("❌ Firebase REST token lookup error:", restData?.error?.message);
                        }
                    } catch (restErr: any) {
                        console.error("❌ Firebase REST token lookup exception:", restErr.message);
                    }
                }
            }

            if (!isVerified) {
                return NextResponse.json(
                    { success: false, error: "Firebase token verification failed." },
                    { status: 401 }
                );
            }

            if (verifiedPhone && verifiedPhone !== phone) {
                return NextResponse.json(
                    { success: false, error: "Phone number mismatch in Firebase token." },
                    { status: 400 }
                );
            }

            if (!user) {
                user = await User.create({
                    name: `User ${phone.slice(-4)}`,
                    phone,
                    whatsapp: phone,
                    isPhoneVerified: true,
                    role: "user",
                });
            } else {
                user.isPhoneVerified = true;
                if (!user.whatsapp) user.whatsapp = phone;
                await user.save();
            }

            return NextResponse.json({
                success: true,
                message: "Firebase Phone verified successfully.",
                token: createMobileAccessToken(user),
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email ?? null,
                    phone: user.phone,
                    role: user.role,
                    isPhoneVerified: true,
                },
            });
        }

        // ── 2. Fallback local OTP / Dev verification ─────────────────────────────
        if (!/^\d{6}$/.test(otp)) {
            return NextResponse.json(
                { success: false, error: "Please enter the 6-digit OTP." },
                { status: 400 }
            );
        }

        // Test numbers (7659989336, 9494378247) always accept "123456" in any env
        const isTestNumber =
            (phone === "7659989336" || phone === "9494378247") && otp === "123456";

        if (!isTestNumber) {
            if (!user || !user.phoneOtp || !user.phoneOtpExpiry) {
                return NextResponse.json(
                    { success: false, error: "No OTP found. Please request a new one." },
                    { status: 400 }
                );
            }

            if (new Date() > user.phoneOtpExpiry) {
                return NextResponse.json(
                    { success: false, error: "OTP has expired. Please request a new one." },
                    { status: 400 }
                );
            }

            const isMatch = await bcrypt.compare(otp, user.phoneOtp);
            if (!isMatch) {
                return NextResponse.json(
                    { success: false, error: "Incorrect OTP. Please try again." },
                    { status: 400 }
                );
            }
        }

        if (!user) {
            user = await User.create({
                name: `User ${phone.slice(-4)}`,
                phone,
                whatsapp: phone,
                isPhoneVerified: true,
                role: "user",
            });
        }

        // Mark phone as verified, clear OTP
        user.isPhoneVerified = true;
        user.phoneOtp = undefined;
        user.phoneOtpExpiry = undefined;
        if (!user.whatsapp) user.whatsapp = phone;
        await user.save();

        return NextResponse.json({
            success: true,
            message: "Phone verified successfully.",
            token: createMobileAccessToken(user),
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email ?? null,
                phone: user.phone,
                role: user.role,
                isPhoneVerified: true,
            },
        });
    } catch (error: any) {
        console.error("[phone-otp/verify]", error);
        return NextResponse.json(
            { success: false, error: error.message || "Verification failed." },
            { status: 500 }
        );
    }
}

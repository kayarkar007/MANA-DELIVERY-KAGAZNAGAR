import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";
import { signupLimiter } from "@/lib/rateLimit";
import { hasAcceptedCurrentPolicies } from "@/lib/privacy";


export async function POST(req: Request) {
    try {
        // ── Rate limit: 5 signups per IP per 15 minutes ───────────────────────
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anonymous";
        const allowed = await signupLimiter.check(ip);
        if (!allowed) {
            const retryAfter = await signupLimiter.retryAfter(ip);
            return NextResponse.json(
                { success: false, error: "Too many signup attempts. Please try again later." },
                {
                    status: 429,
                    headers: {
                        "Cache-Control": "no-store",
                        "Retry-After": String(Math.max(1, retryAfter)),
                    },
                }
            );
        }

        await connectToDatabase();
        const { name, email, password, phone, address, referralCode, privacyPolicyVersion, termsVersion, marketingConsent } = await req.json();
        const cleanPhone = phone ? phone.replace(/\D/g, "").slice(-10) : undefined;


        // 1. Validate Password Strength
        const isStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(password);
        if (!isStrong) {
            return NextResponse.json(
                { success: false, error: "Password does not meet security requirements." },
                { status: 400 }
            );
        }

        if (!hasAcceptedCurrentPolicies({ privacyPolicyVersion, termsVersion })) {
            return NextResponse.json(
                { success: false, error: "Please accept the Privacy Policy and Terms of Service to create an account." },
                { status: 400 }
            );
        }

        // 2. Check if user with email or phone already exists
        const existingUser = await User.findOne({ email });
        if (existingUser && existingUser.isVerified) {
            return NextResponse.json(
                { success: false, error: "An account with this email already exists. Please log in." },
                { status: 400 }
            );
        }

        if (cleanPhone) {
            const existingPhone = await User.findOne({ phone: cleanPhone });
            if (existingPhone && existingPhone.isPhoneVerified) {
                return NextResponse.json(
                    { success: false, error: `An account with +91 ${cleanPhone} already exists. Please log in.` },
                    { status: 400 }
                );
            }
        }

        // 3. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 4. Generate 6-digit OTP and hash it
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        // SECURITY: Store bcrypt hash, never the raw OTP string
        const hashedOtp = await bcrypt.hash(otp, 10);

        // 5. Create User — unverified with complete details
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phone: cleanPhone,
            whatsapp: cleanPhone,
            address: address || undefined,
            referredBy: referralCode || undefined,
            isVerified: false,
            verifyOtp: hashedOtp,
            verifyOtpExpiry: otpExpiry,
            privacyPolicyVersion,
            privacyPolicyAcceptedAt: new Date(),
            termsVersion,
            termsAcceptedAt: new Date(),
            marketingConsent: marketingConsent === true,
            marketingConsentUpdatedAt: new Date(),
        });

        // 6. Send OTP Email — MUST succeed
        const emailResult = await sendEmail(email, "Verify your Mana Delivery Account", buildOtpEmail(name, otp));

        if (!emailResult.success) {
            // Delete the user so they can retry cleanly
            await User.deleteOne({ _id: newUser._id });
            console.error("Failed to send signup verification email", emailResult.error);
            return NextResponse.json(
                {
                    success: false,
                    error: "Registration failed because the verification email could not be sent. Please try again later.",
                },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, message: "Account created! Check your email for the OTP.", email },
            { status: 201 }
        );
    } catch (error) {
        console.error("Signup failed", error);
        return NextResponse.json(
            { success: false, error: "Failed to register user." },
            { status: 500 }
        );
    }
}

function buildOtpEmail(name: string, otp: string): string {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
            <tr><td align="center">
                <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 40px;text-align:center;">
                            <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px;">🛵 Mana Delivery</h1>
                            <p style="margin:6px 0 0;color:#fca5a5;font-size:13px;font-weight:600;">Kagaznagar ki apni delivery service</p>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:36px 40px;">
                            <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800;">Verify Your Email ✉️</h2>
                            <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                                Hi <strong style="color:#111827;">${name}</strong>, welcome to Mana Delivery! 
                                Use the code below to verify your account. It expires in <strong>10 minutes</strong>.
                            </p>

                            <!-- OTP Box -->
                            <div style="background:#fef2f2;border:2px dashed #fca5a5;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
                                <p style="margin:0 0 8px;color:#dc2626;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Your Verification Code</p>
                                <p style="margin:0;color:#dc2626;font-size:42px;font-weight:900;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</p>
                            </div>

                            <div style="background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:24px;">
                                <p style="margin:0;color:#374151;font-size:13px;line-height:1.6;">
                                    ⚠️ <strong>Security tips:</strong><br>
                                    • Never share this code with anyone<br>
                                    • Mana Delivery team will never ask for your OTP<br>
                                    • This code is only valid for 10 minutes
                                </p>
                            </div>

                            <p style="margin:0;color:#9ca3af;font-size:13px;">
                                Didn't create an account? You can safely ignore this email.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                            <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 Mana Delivery, Kagaznagar. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td></tr>
        </table>
    </body>
    </html>
    `;
}

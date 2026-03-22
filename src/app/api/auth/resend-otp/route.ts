import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import { sendEmail } from "@/lib/mailer";

export async function POST(req: Request) {
    try {
        await connectToDatabase();
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ success: false, error: "No account found with this email." }, { status: 404 });
        }

        if (user.isVerified) {
            return NextResponse.json({ success: false, error: "This account is already verified." }, { status: 400 });
        }

        // Generate fresh OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.verifyOtp = otp;
        user.verifyOtpExpiry = otpExpiry;
        await user.save();

        const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"></head>
        <body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
                <tr><td align="center">
                    <table width="100%" style="max-width:520px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
                        <tr>
                            <td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:32px 40px;text-align:center;">
                                <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:900;">🛵 Mana Delivery</h1>
                                <p style="margin:6px 0 0;color:#fca5a5;font-size:13px;font-weight:600;">New verification code for your account</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="padding:36px 40px;">
                                <h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:800;">New Code Requested 🔄</h2>
                                <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                                    Hi <strong style="color:#111827;">${user.name}</strong>, here's your new verification code. It expires in <strong>10 minutes</strong>.
                                </p>
                                <div style="background:#fef2f2;border:2px dashed #fca5a5;border-radius:16px;padding:28px;text-align:center;margin-bottom:24px;">
                                    <p style="margin:0 0 8px;color:#dc2626;font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;">Your New Verification Code</p>
                                    <p style="margin:0;color:#dc2626;font-size:42px;font-weight:900;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</p>
                                </div>
                                <p style="margin:0;color:#9ca3af;font-size:13px;">Never share this code with anyone.</p>
                            </td>
                        </tr>
                        <tr>
                            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #f3f4f6;">
                                <p style="margin:0;color:#9ca3af;font-size:12px;">© 2025 Mana Delivery, Kagaznagar</p>
                            </td>
                        </tr>
                    </table>
                </td></tr>
            </table>
        </body>
        </html>
        `;

        const emailResult = await sendEmail(email, "New Verification Code – Mana Delivery", html);

        if (!emailResult.success) {
            return NextResponse.json(
                { success: false, error: `Could not send email: ${emailResult.error}` },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, message: "New OTP sent to your email!" }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message || "Failed to resend OTP." },
            { status: 500 }
        );
    }
}

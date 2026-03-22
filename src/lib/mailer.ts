import nodemailer from "nodemailer";

/**
 * Sends an email using Gmail SMTP.
 * Requires EMAIL_USER (your gmail) and EMAIL_PASS (Gmail App Password) in .env.local
 *
 * How to get Gmail App Password:
 * 1. Go to myaccount.google.com/security
 * 2. Enable 2-Step Verification
 * 3. Go to App Passwords → Select "Mail" → Generate
 * 4. Copy the 16-character password into EMAIL_PASS in .env.local
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass || emailPass === "xxxx xxxx xxxx xxxx") {
        console.error("❌ MAILER ERROR: EMAIL_USER or EMAIL_PASS not configured in .env.local");
        return { success: false, error: "Email service not configured. Contact admin." };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // STARTTLS
            auth: {
                user: emailUser,
                pass: emailPass,
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        // Verify connection before sending
        await transporter.verify();

        const info = await transporter.sendMail({
            from: `"Mana Delivery" <${emailUser}>`,
            to,
            subject,
            html,
        });

        console.log("✅ Email sent successfully:", info.messageId);
        return { success: true };
    } catch (error: any) {
        console.error("❌ Email send failed:", error.message);
        return { success: false, error: error.message };
    }
};

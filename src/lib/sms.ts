/**
 * sms.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * SMS Gateway Integration (Fast2SMS / Twilio / MSG91) for Mana Delivery.
 *
 * Configured via environment variables:
 *  • FAST2SMS_API_KEY (Fast2SMS - popular for Indian mobile numbers)
 *  • TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (Twilio fallback)
 *
 * If credentials are not present, logs SMS contents to console without breaking flow.
 */

export interface SMSOptions {
    to: string;       // Phone number (10-digit Indian number or E.164)
    message: string;  // Plain text message content
}

/**
 * Formats Indian 10-digit numbers to clean 10-digit format for Fast2SMS or E.164 (+91) for Twilio.
 */
function cleanPhoneNumber(phone: string): { tenDigit: string; e164: string } {
    const digitsOnly = phone.replace(/\D/g, "");
    const tenDigit = digitsOnly.length > 10 ? digitsOnly.slice(-10) : digitsOnly;
    const e164 = `+91${tenDigit}`;
    return { tenDigit, e164 };
}

/**
 * Sends a transactional SMS message via Fast2SMS (primary for India) or Twilio (fallback).
 */
export async function sendSMS({ to, message }: SMSOptions): Promise<{ success: boolean; provider?: string; error?: string }> {
    const { tenDigit, e164 } = cleanPhoneNumber(to);

    if (!tenDigit || tenDigit.length !== 10) {
        console.warn("⚠️ SMS skipped: Invalid 10-digit phone number:", to);
        return { success: false, error: "Invalid phone number format" };
    }

    const fast2smsKey = process.env.FAST2SMS_API_KEY;
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;

    // ── 1. Fast2SMS (Preferred for India) ───────────────────────────────────────
    if (fast2smsKey) {
        try {
            const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
                method: "POST",
                headers: {
                    "authorization": fast2smsKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    route: "otp",
                    variables_values: message,
                    numbers: tenDigit,
                }),
            });

            const resData = await response.json();
            if (resData?.return) {
                console.log(`✅ Fast2SMS sent successfully to ${tenDigit}`);
                return { success: true, provider: "Fast2SMS" };
            } else {
                console.warn("⚠️ Fast2SMS response error:", resData?.message || resData);
            }
        } catch (err: any) {
            console.error("❌ Fast2SMS fetch exception:", err.message);
        }
    }

    // ── 2. Twilio (Fallback) ──────────────────────────────────────────────────
    if (twilioSid && twilioToken && process.env.TWILIO_PHONE_NUMBER) {
        try {
            const authHeader = `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`;
            const bodyParams = new URLSearchParams({
                To: e164,
                From: process.env.TWILIO_PHONE_NUMBER,
                Body: message,
            });

            const response = await fetch(
                `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": authHeader,
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: bodyParams.toString(),
                }
            );

            const resData = await response.json();
            if (response.ok && resData.sid) {
                console.log(`✅ Twilio SMS sent successfully to ${e164} (SID: ${resData.sid})`);
                return { success: true, provider: "Twilio" };
            } else {
                console.warn("⚠️ Twilio API error:", resData?.message || resData);
            }
        } catch (err: any) {
            console.error("❌ Twilio fetch exception:", err.message);
        }
    }

    // ── 3. Fallback (Development logging) ──────────────────────────────────────
    console.log(`📱 [SMS Simulated] To: ${tenDigit} | Msg: "${message}"`);
    return { success: true, provider: "Simulated (No API keys set)" };
}

/**
 * Sends OTP SMS helper
 */
export async function sendOTPSMS(phone: string, otp: string): Promise<boolean> {
    const msg = `Your Mana Delivery verification OTP is ${otp}. Valid for 10 minutes. Do not share it with anyone.`;
    const res = await sendSMS({ to: phone, message: msg });
    return res.success;
}

/**
 * Sends Order status update SMS
 */
export async function sendOrderStatusSMS(phone: string, orderShortId: string, status: string): Promise<boolean> {
    const statusMsgs: Record<string, string> = {
        pending: `Mana Delivery: Order #${orderShortId} received! We are confirming it now.`,
        processing: `Mana Delivery: Order #${orderShortId} is being prepared.`,
        shipped: `Mana Delivery: Order #${orderShortId} is out for delivery with our rider!`,
        delivered: `Mana Delivery: Order #${orderShortId} delivered! Thank you for ordering with us.`,
        cancelled: `Mana Delivery: Order #${orderShortId} was cancelled. Refund processed to your wallet.`,
    };

    const msg = statusMsgs[status] || `Mana Delivery: Order #${orderShortId} status updated to ${status}.`;
    const res = await sendSMS({ to: phone, message: msg });
    return res.success;
}

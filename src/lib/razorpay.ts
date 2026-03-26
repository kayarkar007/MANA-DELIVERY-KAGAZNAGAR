import crypto from "node:crypto";
import Razorpay from "razorpay";

export function getRazorpayClient() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Razorpay credentials are not configured in the environment variables.");
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    });
}

export function verifyRazorpaySignature(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
        throw new Error("Razorpay secret is not configured");
    }

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest("hex");

    return expectedSignature === razorpaySignature;
}

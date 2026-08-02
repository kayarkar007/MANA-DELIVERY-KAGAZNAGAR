import crypto from "node:crypto";

const OTP_TTL_MS = 48 * 60 * 60 * 1000;

function getKey() {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) throw new Error("NEXTAUTH_SECRET is required for delivery OTP protection");
    return crypto.createHash("sha256").update(secret).digest();
}

export function createDeliveryOtp() {
    const value = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
    const key = getKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();

    return {
        encrypted: `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`,
        hash: crypto.createHmac("sha256", key).update(value).digest("hex"),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
        value,
    };
}

export function revealDeliveryOtp(value?: string) {
    if (!value) return undefined;
    if (!value.startsWith("v1.")) return value;

    try {
        const [, ivValue, tagValue, ciphertextValue] = value.split(".");
        if (!ivValue || !tagValue || !ciphertextValue) return undefined;

        const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivValue, "base64url"));
        decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
        return Buffer.concat([
            decipher.update(Buffer.from(ciphertextValue, "base64url")),
            decipher.final(),
        ]).toString("utf8");
    } catch {
        return undefined;
    }
}

export function isValidDeliveryOtp(input: string, hash?: string, legacyValue?: string) {
    if (hash) {
        const actual = crypto.createHmac("sha256", getKey()).update(input).digest("hex");
        const actualBuffer = Buffer.from(actual);
        const expectedBuffer = Buffer.from(hash);
        return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
    }

    if (!legacyValue) return false;
    const actual = Buffer.from(input);
    const expected = Buffer.from(legacyValue);
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function hideDeliveryOtp<T extends Record<string, any>>(order: T): T {
    const data = typeof order.toObject === "function" ? order.toObject() : { ...order };
    delete data.deliveryOtp;
    delete data.deliveryOtpHash;
    delete data.deliveryOtpExpiresAt;
    delete data.deliveryOtpAttempts;
    return data;
}

export function revealDeliveryOtpForOwner<T extends Record<string, any>>(order: T): T {
    const data = hideDeliveryOtp(order) as Record<string, any>;
    const otp = revealDeliveryOtp((order as Record<string, any>).deliveryOtp);
    if (otp) data.deliveryOtp = otp;
    return data as T;
}

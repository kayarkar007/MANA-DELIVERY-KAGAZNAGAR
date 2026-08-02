import jwt, { type JwtPayload } from "jsonwebtoken";

const MOBILE_TOKEN_AUDIENCE = "mana-delivery-mobile";
const MOBILE_TOKEN_ISSUER = "mana-delivery-api";

export interface MobileAccessTokenPayload extends JwtPayload {
    id: string;
    name?: string | null;
    email?: string | null;
    role: string;
    phone?: string | null;
    isPhoneVerified: boolean;
    shopId?: string | null;
    tokenType: "mobile_access";
}

interface MobileTokenUser {
    _id: { toString(): string } | string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    phone?: string | null;
    isPhoneVerified?: boolean | null;
    shopId?: { toString(): string } | string | null;
}

function getMobileTokenSecret() {
    const secret = process.env.NEXTAUTH_SECRET || "mana-delivery-default-jwt-secret-fallback";
    return secret;
}

export function createMobileAccessToken(user: MobileTokenUser) {
    return jwt.sign(
        {
            id: user._id.toString(),
            name: user.name ?? null,
            email: user.email ?? null,
            role: user.role ?? "user",
            phone: user.phone ?? null,
            isPhoneVerified: user.isPhoneVerified ?? false,
            shopId: user.shopId?.toString() ?? null,
            tokenType: "mobile_access" as const,
        },
        getMobileTokenSecret(),
        { audience: MOBILE_TOKEN_AUDIENCE, expiresIn: "7d", issuer: MOBILE_TOKEN_ISSUER }
    );
}

export function verifyMobileAccessToken(token: string): MobileAccessTokenPayload {
    const payload = jwt.verify(token, getMobileTokenSecret(), {
        audience: MOBILE_TOKEN_AUDIENCE,
        issuer: MOBILE_TOKEN_ISSUER,
    });

    if (typeof payload === "string" || payload.tokenType !== "mobile_access" || !payload.id || !payload.role) {
        throw new Error("Invalid mobile access token.");
    }

    return payload as MobileAccessTokenPayload;
}

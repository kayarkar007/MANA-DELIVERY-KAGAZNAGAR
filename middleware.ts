import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that phone-unverified users can access freely
const PHONE_VERIFY_EXEMPT = [
    "/verify-phone",
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
];

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    if (!token) {
        const loginUrl = new URL("/login", request.url);
        const callbackUrl = `${pathname}${request.nextUrl.search}`;
        loginUrl.searchParams.set("callbackUrl", callbackUrl);
        return NextResponse.redirect(loginUrl);
    }

    // ── Phone Verification Gate ────────────────────────────────────────────────
    // If the user is logged in but has NOT verified their phone, redirect them
    // to /verify-phone (except for explicitly exempt routes).
    const isExempt = PHONE_VERIFY_EXEMPT.some((p) => pathname.startsWith(p));
    if (!isExempt && !token.isPhoneVerified) {
        const verifyUrl = new URL("/verify-phone", request.url);
        verifyUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
        return NextResponse.redirect(verifyUrl);
    }

    // ── Role-based route protection at the Edge ────────────────────────────────
    const isAdminRoute = pathname.startsWith("/admin");
    if (isAdminRoute && token.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    const isRiderRoute = pathname.startsWith("/rider");
    if (isRiderRoute && token.role !== "rider" && token.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/checkout",
        "/checkout/:path*",
        "/admin",
        "/admin/:path*",
        "/profile",
        "/profile/:path*",
        "/rider",
        "/rider/:path*",
        "/verify-phone",
    ],
};

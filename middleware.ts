import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
        const loginUrl = new URL("/login", request.url);
        const callbackUrl = `${request.nextUrl.pathname}${request.nextUrl.search}`;
        loginUrl.searchParams.set("callbackUrl", callbackUrl);
        return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection at the Edge
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
    if (isAdminRoute && token.role !== "admin") {
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
    ],
};

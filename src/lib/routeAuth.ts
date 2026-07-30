import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import type { Session } from "next-auth";
import jwt from "jsonwebtoken";
import { headers } from "next/headers";

type AuthResult =
  | { session: Session; response?: never }
  | { session?: never; response: NextResponse };

function unauthorized(message = "Unauthorized", status = 401) {
  return NextResponse.json({ success: false as const, error: message }, { status });
}

// ── Original functions — UNCHANGED (web app uses these) ──────────────────────

export async function requireUser(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: unauthorized() };
  return { session };
}

export async function requireAdmin(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { response: unauthorized() };
  if (session.user.role !== "admin") return { response: unauthorized("Forbidden", 403) };
  return { session };
}

// ── New dual-mode functions — support BOTH web cookies AND mobile Bearer JWT ──
// These are used by mobile-facing API routes. Web APIs keep using requireAdmin().

/**
 * Extracts Bearer JWT token from Authorization header (mobile apps).
 * Returns decoded payload or null if invalid/missing.
 */
function extractBearerToken(authHeader: string | null): any | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.NEXTAUTH_SECRET!);
  } catch {
    return null;
  }
}

/**
 * Dual-mode auth for mobile API routes.
 * Tries NextAuth session first (web), then Bearer JWT (mobile).
 */
async function requireRoleFlexible(role: string): Promise<AuthResult> {
  // 1. Try NextAuth web session first
  const session = await getServerSession(authOptions);
  if (session?.user?.role === role) return { session };
  // Also allow admin to access any role's endpoints
  if (session?.user?.role === "admin" && role !== "admin") return { session };

  // 2. Fall back to Bearer JWT (mobile apps)
  const headerStore = await headers();
  const authHeader = headerStore.get("authorization");
  const decoded = extractBearerToken(authHeader);

  if (!decoded) return { response: unauthorized() };
  if (decoded.role !== role && decoded.role !== "admin") {
    return { response: unauthorized("Forbidden", 403) };
  }

  // Build a minimal session-like object from JWT payload
  const mobileSession = {
    user: {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email ?? null,
      role: decoded.role,
      phone: decoded.phone ?? null,
      isPhoneVerified: decoded.isPhoneVerified ?? false,
    },
    expires: new Date(decoded.exp * 1000).toISOString(),
  } as unknown as Session;

  return { session: mobileSession };
}

/** For Rider mobile app routes — accepts rider session OR Bearer JWT with role=rider */
export async function requireRider(): Promise<AuthResult> {
  return requireRoleFlexible("rider");
}

/** For Vendor mobile app routes — accepts vendor session OR Bearer JWT with role=vendor */
export async function requireVendor(): Promise<AuthResult> {
  return requireRoleFlexible("vendor");
}

/** For Admin mobile app routes — accepts admin session OR Bearer JWT with role=admin */
export async function requireAdminFlexible(): Promise<AuthResult> {
  return requireRoleFlexible("admin");
}

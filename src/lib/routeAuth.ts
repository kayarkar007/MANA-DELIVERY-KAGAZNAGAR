import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Session } from "next-auth";

type AuthResult =
  | { session: Session }
  | { response: NextResponse<{ success: false; error: string }> };

function unauthorized(message = "Unauthorized", status = 401) {
  return NextResponse.json({ success: false, error: message }, { status });
}

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


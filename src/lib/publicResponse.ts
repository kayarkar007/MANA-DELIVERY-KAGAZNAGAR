import { NextResponse } from "next/server";

export function publicJson(data: unknown, startedAt: number, maxAgeSeconds: number) {
    const response = NextResponse.json(data);
    response.headers.set("Cache-Control", `public, s-maxage=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 5}`);
    response.headers.set("Server-Timing", `app;dur=${Math.max(0, Date.now() - startedAt)}`);
    return response;
}

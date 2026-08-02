import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
    const startedAt = Date.now();
    let isHealthy = false;
    let databaseDurationMs = 0;

    try {
        const databaseStartedAt = Date.now();
        await connectToDatabase();
        if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
            isHealthy = true;
        }
        databaseDurationMs = Date.now() - databaseStartedAt;
    } catch (error) {
        console.error("Health check failed", error);
    }

    return NextResponse.json(
        {
            status: isHealthy ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            service: "Mana Delivery API",
        },
        {
            status: isHealthy ? 200 : 503,
            headers: {
                "Cache-Control": "no-store",
                "Server-Timing": `db;dur=${databaseDurationMs}, app;dur=${Date.now() - startedAt}`,
            },
        }
    );
}

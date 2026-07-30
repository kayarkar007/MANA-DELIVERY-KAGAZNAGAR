import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
    const startTime = Date.now();
    let dbStatus = "disconnected";
    let dbLatencyMs = 0;

    try {
        await connectToDatabase();
        const dbStart = Date.now();
        if (mongoose.connection.db) {
            await mongoose.connection.db.admin().ping();
            dbStatus = "connected";
            dbLatencyMs = Date.now() - dbStart;
        }
    } catch (err: any) {
        dbStatus = `error: ${err.message}`;
    }

    const uptimeSeconds = process.uptime();
    const memoryUsageMB = {
        rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    };

    const isHealthy = dbStatus === "connected";

    return NextResponse.json(
        {
            status: isHealthy ? "ok" : "degraded",
            timestamp: new Date().toISOString(),
            service: "Mana Delivery API",
            environment: process.env.NODE_ENV || "development",
            responseTimeMs: Date.now() - startTime,
            checks: {
                database: {
                    status: dbStatus,
                    latencyMs: dbLatencyMs,
                },
            },
            system: {
                uptimeSeconds: Math.round(uptimeSeconds),
                memoryUsageMB,
            },
        },
        { status: isHealthy ? 200 : 503 }
    );
}

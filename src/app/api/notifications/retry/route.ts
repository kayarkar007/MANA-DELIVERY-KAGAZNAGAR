import { NextResponse } from "next/server";
import { processRetryQueue } from "@/lib/notifications";

export async function GET(request: Request) {
    try {
        // Require a secret on EVERY call — set CRON_SECRET in your environment variables.
        const expectedSecret = process.env.CRON_SECRET;
        const authHeader = request.headers.get("authorization");

        if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const results = await processRetryQueue();

        return NextResponse.json({
            success: true,
            message: "Retry queue processed",
            data: results,
        });
    } catch (error: any) {
        console.error("Failed to process retry queue:", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

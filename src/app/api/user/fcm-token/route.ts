import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedFlexible } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    const auth = await requireAuthenticatedFlexible();
    if ("response" in auth) return auth.response;

    try {
        const { fcmToken, token } = await req.json();
        const finalToken = fcmToken || token;

        if (!finalToken || typeof finalToken !== "string" || finalToken.length > 4096) {
            return NextResponse.json({ success: false, error: "fcmToken string required" }, { status: 400 });
        }

        await connectToDatabase();
        await User.findByIdAndUpdate(auth.session.user.id, { fcmToken: finalToken });

        return NextResponse.json({ success: true, message: "FCM token saved successfully" });
    } catch (error) {
        console.error("Failed to save FCM token:", error);
        return NextResponse.json({ success: false, error: "Failed to save FCM token" }, { status: 500 });
    }
}

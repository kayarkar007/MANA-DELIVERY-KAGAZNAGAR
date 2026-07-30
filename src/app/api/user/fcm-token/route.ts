import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token || !token.id) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { fcmToken } = await req.json();
        if (!fcmToken || typeof fcmToken !== "string") {
            return NextResponse.json({ success: false, error: "fcmToken string required" }, { status: 400 });
        }

        await connectToDatabase();
        await User.findByIdAndUpdate(token.id, { fcmToken });

        return NextResponse.json({ success: true, message: "FCM token saved successfully" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

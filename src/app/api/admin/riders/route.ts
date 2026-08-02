import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import { requireAdminFlexible } from "@/lib/routeAuth";

export async function GET() {
    try {
        const auth = await requireAdminFlexible();
        if ("response" in auth) return auth.response;

        await connectToDatabase();

        const riders = await User.find({ role: "rider" })
            .select("name email whatsapp isOnDuty dutyStatus currentLocation currentShiftStartedAt")
            .sort({ isOnDuty: -1, dutyStatus: 1, name: 1 });

        return NextResponse.json({ success: true, data: riders });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

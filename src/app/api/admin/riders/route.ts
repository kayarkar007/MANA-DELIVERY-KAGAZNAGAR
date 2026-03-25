import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const riders = await User.find({ role: "rider" })
            .select("name email whatsapp isOnDuty dutyStatus currentLocation currentShiftStartedAt")
            .sort({ isOnDuty: -1, dutyStatus: 1, name: 1 });

        return NextResponse.json({ success: true, data: riders });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

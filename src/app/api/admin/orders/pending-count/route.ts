import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const count = await Order.countDocuments({ status: "pending" });

        return NextResponse.json({ success: true, count });
    } catch (error) {
        console.error("Failed to fetch pending orders count:", error);
        return NextResponse.json({ success: false, error: "Server Error" }, { status: 500 });
    }
}


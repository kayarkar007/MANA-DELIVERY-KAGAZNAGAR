import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import { requireAdmin } from "@/lib/routeAuth";

// GET: list all users
export async function GET() {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();

        const users = await User.find({}, {
            name: 1, email: 1, role: 1, walletBalance: 1, whatsapp: 1, createdAt: 1
        }).sort({ createdAt: -1 }).lean();

        return NextResponse.json({ success: true, data: users });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// PATCH: update a user's role
export async function PATCH(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        const { userId, role } = await req.json();

        const validRoles = ["user", "rider", "admin"];
        if (!userId || !validRoles.includes(role)) {
            return NextResponse.json({ success: false, error: "Invalid userId or role" }, { status: 400 });
        }

        await connectToDatabase();

        const updated = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, select: "name email role walletBalance" }
        );

        if (!updated) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Notification from "@/models/Notification";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));

        const query = { recipientId: session.user.id };
        const total = await Notification.countDocuments(query);
        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const unreadCount = await Notification.countDocuments({
            recipientId: session.user.id,
            readAt: { $exists: false },
        });

        return NextResponse.json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const body = await req.json();
        const ids = Array.isArray(body.ids) ? body.ids.map((id: any) => `${id}`) : [];
        const query = body.markAll
            ? { recipientId: session.user.id, readAt: { $exists: false } }
            : { recipientId: session.user.id, _id: { $in: ids } };

        await Notification.updateMany(query, { $set: { readAt: new Date() } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

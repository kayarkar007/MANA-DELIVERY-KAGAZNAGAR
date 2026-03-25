import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import SupportTicket from "@/models/SupportTicket";
import User from "@/models/User";
import { createNotification, notifyAdmins } from "@/lib/notifications";

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
        const status = searchParams.get("status");
        const search = `${searchParams.get("search") || ""}`.trim();

        const query: Record<string, any> = {};
        if (session.user.role !== "admin") {
            query.userId = session.user.id;
        }
        if (status) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { subject: { $regex: search, $options: "i" } },
                { message: { $regex: search, $options: "i" } },
                { customerName: { $regex: search, $options: "i" } },
                { customerPhone: { $regex: search, $options: "i" } },
            ];
        }

        const total = await SupportTicket.countDocuments(query);
        const tickets = await SupportTicket.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: tickets,
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

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const body = await req.json();
        const message = `${body.message || ""}`.trim();
        const subject = `${body.subject || ""}`.trim() || "Support request";
        const category = `${body.category || "order"}`.trim();
        const orderId = `${body.orderId || ""}`.trim() || undefined;
        const priority = `${body.priority || "medium"}`.trim();

        if (!message) {
            return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 });
        }

        const user = await User.findById(session.user.id).select("name whatsapp");
        const ticket = await SupportTicket.create({
            userId: session.user.id,
            orderId,
            customerName: user?.name || session.user.name || "Customer",
            customerPhone: user?.whatsapp || "",
            subject,
            message,
            category,
            priority,
        });

        await notifyAdmins({
            title: "New Support Ticket",
            message: `${ticket.customerName} raised ${subject}`,
            type: "support",
            href: "/admin/support",
            metadata: { ticketId: ticket._id.toString(), orderId },
        });

        return NextResponse.json({ success: true, data: ticket }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

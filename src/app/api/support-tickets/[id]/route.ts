import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import SupportTicket from "@/models/SupportTicket";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const { id } = await params;
        const body = await req.json();
        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
            return NextResponse.json({ success: false, error: "Ticket not found" }, { status: 404 });
        }

        if (body.status) ticket.status = body.status;
        if (body.priority) ticket.priority = body.priority;
        if (body.adminNotes !== undefined) ticket.adminNotes = body.adminNotes;
        if (body.assignedTo !== undefined) ticket.assignedTo = body.assignedTo;
        if (["resolved", "closed"].includes(ticket.status)) {
            ticket.resolvedAt = new Date();
        }

        await ticket.save();

        if (ticket.userId) {
            await createNotification({
                recipientId: ticket.userId,
                recipientRole: "user",
                title: "Support Ticket Updated",
                message: `${ticket.subject} is now ${ticket.status.replace("_", " ")}`,
                type: "support",
                href: "/profile/tickets",
                metadata: { ticketId: ticket._id.toString() },
            });
        }

        return NextResponse.json({ success: true, data: ticket });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

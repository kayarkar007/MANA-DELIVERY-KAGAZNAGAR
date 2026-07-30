import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== "admin") {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");

        const query: Record<string, any> = {};
        if (status) query.status = status;

        const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

        // Build CSV rows
        const headers = ["Order ID", "Customer Name", "Customer Phone", "Address", "Type", "Status", "Payment Method", "Payment Status", "Subtotal", "Delivery Fee", "Total", "Date"];
        const rows = orders.map((o: any) => [
            `"${o._id.toString().slice(-6).toUpperCase()}"`,
            `"${(o.customerName || "").replace(/"/g, '""')}"`,
            `"${(o.customerPhone || "").replace(/"/g, '""')}"`,
            `"${(o.address || "").replace(/"/g, '""')}"`,
            `"${o.type || "product"}"`,
            `"${o.status || "pending"}"`,
            `"${o.paymentMethod || "cod"}"`,
            `"${o.paymentStatus || "pending"}"`,
            (o.subtotal || 0).toFixed(2),
            (o.deliveryFee || 0).toFixed(2),
            (o.total || 0).toFixed(2),
            `"${new Date(o.createdAt).toLocaleString("en-IN")}"`,
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

        return new Response(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename=mana_orders_export_${new Date().toISOString().split("T")[0]}.csv`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

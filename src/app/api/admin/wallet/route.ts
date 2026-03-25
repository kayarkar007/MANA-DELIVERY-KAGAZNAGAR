import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/routeAuth";
import { createWalletTransaction } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";

export async function POST(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        const body = await req.json();
        const userId = `${body.userId || ""}`.trim();
        const amount = Number(body.amount);
        const type = body.type === "debit" ? "debit" : "credit";
        const note = `${body.note || ""}`.trim();

        if (!userId || !Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ success: false, error: "Invalid wallet adjustment" }, { status: 400 });
        }

        const result = await createWalletTransaction({
            userId,
            amount,
            type,
            source: "admin_adjustment",
            note: note || `Admin ${type}`,
            createdBy: auth.session.user.id,
        });

        await createNotification({
            recipientId: userId,
            recipientRole: "user",
            title: "Wallet Updated",
            message: `${type === "credit" ? "₹" + amount + " added to" : "₹" + amount + " deducted from"} your wallet`,
            type: "wallet",
            href: "/profile/wallet",
            metadata: { balanceAfter: result.balanceAfter },
        });

        return NextResponse.json({ success: true, data: result });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

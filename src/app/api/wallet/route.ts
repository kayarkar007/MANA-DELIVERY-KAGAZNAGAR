import { NextRequest, NextResponse } from "next/server";
import { requireUserFlexible } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import WalletTransaction from "@/models/WalletTransaction";

export async function GET(request: NextRequest) {
    const auth = await requireUserFlexible();
    if ("response" in auth) return auth.response;

    try {
        await connectToDatabase();

        const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 20));
        const userId = auth.session.user.id;
        const [user, transactions] = await Promise.all([
            User.findById(userId).select("walletBalance").lean(),
            WalletTransaction.find({ userId })
                .sort({ createdAt: -1 })
                .limit(limit)
                .select("amount type source note balanceAfter createdAt")
                .lean(),
        ]);

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            balance: Number(user.walletBalance) || 0,
            data: transactions,
        });
    } catch (error) {
        console.error("Failed to retrieve wallet:", error);
        return NextResponse.json({ success: false, error: "Failed to retrieve wallet" }, { status: 500 });
    }
}

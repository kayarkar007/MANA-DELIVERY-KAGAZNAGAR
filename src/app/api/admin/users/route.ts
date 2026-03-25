import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import { requireAdmin } from "@/lib/routeAuth";
import { createWalletTransaction } from "@/lib/wallet";
import { createNotification } from "@/lib/notifications";

// GET: list all users
export async function GET(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
        const search = `${searchParams.get("search") || ""}`.trim();

        const query: Record<string, any> = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
                { whatsapp: { $regex: search, $options: "i" } },
            ];
        }

        const total = await User.countDocuments(query);
        const users = await User.find(query, {
            name: 1,
            email: 1,
            role: 1,
            walletBalance: 1,
            whatsapp: 1,
            createdAt: 1,
            dutyStatus: 1,
            isOnDuty: 1,
        })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: users,
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

// PATCH: update a user's role
export async function PATCH(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        const body = await req.json();
        const { userId, role } = body;

        if (body.action === "wallet_adjustment") {
            const amount = Number(body.amount);
            const type = body.type === "debit" ? "debit" : "credit";

            if (!body.userId || !Number.isFinite(amount) || amount <= 0) {
                return NextResponse.json({ success: false, error: "Invalid wallet adjustment" }, { status: 400 });
            }

            const result = await createWalletTransaction({
                userId: body.userId,
                amount,
                type,
                source: "admin_adjustment",
                note: `${body.note || "Admin wallet adjustment"}`,
                createdBy: auth.session.user.id,
            });

            await createNotification({
                recipientId: body.userId,
                recipientRole: "user",
                title: "Wallet Updated",
                message: `${type === "credit" ? "Rs " + amount + " added to" : "Rs " + amount + " deducted from"} your wallet`,
                type: "wallet",
                href: "/profile/wallet",
                metadata: { balanceAfter: result.balanceAfter },
            });

            return NextResponse.json({ success: true, data: result });
        }

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

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/routeAuth";
import connectToDatabase from "@/lib/mongoose";
import Review from "@/models/Review";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page")) || 1);
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 10));
        const status = searchParams.get("status");
        const search = `${searchParams.get("search") || ""}`.trim();

        const query: Record<string, any> = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { comment: { $regex: search, $options: "i" } },
                { orderId: { $regex: search, $options: "i" } },
                { userId: { $regex: search, $options: "i" } },
            ];
        }

        const total = await Review.countDocuments(query);
        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            success: true,
            data: reviews,
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
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const body = await req.json();
        const reviewId = `${body.reviewId || ""}`.trim();
        const status = body.status === "hidden" ? "hidden" : "approved";
        const moderationNote = `${body.moderationNote || ""}`.trim();

        const review = await Review.findByIdAndUpdate(
            reviewId,
            {
                status,
                moderationNote: moderationNote || undefined,
                moderatedBy: auth.session.user.id,
                moderatedAt: new Date(),
            },
            { new: true }
        );

        if (!review) {
            return NextResponse.json({ success: false, error: "Review not found" }, { status: 404 });
        }

        await createNotification({
            recipientId: review.userId,
            recipientRole: "user",
            title: "Review Moderated",
            message: `Your review is now ${status}`,
            type: "review",
            href: "/profile",
            metadata: { reviewId: review._id.toString() },
        });

        return NextResponse.json({ success: true, data: review });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const auth = await requireAdmin();
        if ("response" in auth) return auth.response;

        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const reviewId = `${searchParams.get("reviewId") || ""}`.trim();

        if (!reviewId) {
            return NextResponse.json({ success: false, error: "reviewId is required" }, { status: 400 });
        }

        await Review.findByIdAndDelete(reviewId);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

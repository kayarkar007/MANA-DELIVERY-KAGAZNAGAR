import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Review from "@/models/Review";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        // Fetch all reviews for the current user
        const reviews = await Review.find({ userId: session.user.id }).sort({ createdAt: -1 });

        return NextResponse.json({ success: true, data: reviews }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


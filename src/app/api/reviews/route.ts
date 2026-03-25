import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Review from "@/models/Review";
import Order from "@/models/Order";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { orderId, rating, comment } = await req.json();

        if (!orderId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ success: false, error: "Invalid review data" }, { status: 400 });
        }

        await connectToDatabase();

        // Check if order exists and belongs to user
        const order = await Order.findOne({ _id: orderId, userId: session.user.id });
        if (!order) {
            return NextResponse.json({ success: false, error: "Order not found or unauthorized" }, { status: 404 });
        }

        if (order.status !== "delivered") {
            return NextResponse.json({ success: false, error: "Can only review delivered orders" }, { status: 400 });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({ orderId, userId: session.user.id });
        if (existingReview) {
            return NextResponse.json({ success: false, error: "You have already reviewed this order" }, { status: 400 });
        }

        const review = await Review.create({
            userId: session.user.id,
            orderId,
            rating,
            comment
        });

        return NextResponse.json({ success: true, data: review }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


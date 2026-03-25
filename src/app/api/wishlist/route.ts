import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Wishlist from "@/models/Wishlist";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        await connectToDatabase();
        let wishlist = await Wishlist.findOne({ userId: session.user.id });
        if (!wishlist) {
            wishlist = await Wishlist.create({ userId: session.user.id, productIds: [] });
        }
        return NextResponse.json({ success: true, data: wishlist.productIds }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }
        const { productId } = await req.json();
        if (!productId) {
            return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
        }
        await connectToDatabase();
        let wishlist = await Wishlist.findOne({ userId: session.user.id });

        if (!wishlist) {
            wishlist = await Wishlist.create({ userId: session.user.id, productIds: [productId] });
        } else {
            const index = wishlist.productIds.indexOf(productId);
            if (index > -1) {
                // Remove if already in wishlist
                wishlist.productIds.splice(index, 1);
            } else {
                // Add to wishlist
                wishlist.productIds.push(productId);
            }
            await wishlist.save();
        }

        return NextResponse.json({ success: true, data: wishlist.productIds }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


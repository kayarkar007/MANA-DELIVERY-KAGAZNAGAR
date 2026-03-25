import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const wishlist = await Wishlist.findOne({ userId: session.user.id });
        if (!wishlist || !wishlist.productIds.length) {
            return NextResponse.json({ success: true, data: [] }, { status: 200 });
        }

        const products = await Product.find({ _id: { $in: wishlist.productIds } });
        return NextResponse.json({ success: true, data: products }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


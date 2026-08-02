import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Wishlist from "@/models/Wishlist";
import { requireAuthenticatedFlexible } from "@/lib/routeAuth";

export async function GET(req: Request) {
    try {
        const auth = await requireAuthenticatedFlexible();
        if ("response" in auth) return auth.response;
        const userId = auth.session.user.id;

        await connectToDatabase();
        let wishlist = await Wishlist.findOne({ userId });
        if (!wishlist) {
            wishlist = await Wishlist.create({ userId, productIds: [] });
        }
        return NextResponse.json({ success: true, data: wishlist.productIds }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const auth = await requireAuthenticatedFlexible();
        if ("response" in auth) return auth.response;
        const userId = auth.session.user.id;

        const { productId } = await req.json();
        if (!productId) {
            return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
        }
        await connectToDatabase();
        let wishlist = await Wishlist.findOne({ userId });

        if (!wishlist) {
            wishlist = await Wishlist.create({ userId, productIds: [productId] });
        } else {
            const index = wishlist.productIds.indexOf(productId);
            if (index > -1) {
                wishlist.productIds.splice(index, 1);
            } else {
                wishlist.productIds.push(productId);
            }
            await wishlist.save();
        }

        return NextResponse.json({ success: true, data: wishlist.productIds }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

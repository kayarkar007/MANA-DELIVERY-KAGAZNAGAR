import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Wishlist from "@/models/Wishlist";
import Product from "@/models/Product";
import Shop from "@/models/Shop";
import { requireAuthenticatedFlexible } from "@/lib/routeAuth";

export async function GET(req: Request) {
    try {
        const auth = await requireAuthenticatedFlexible();
        if ("response" in auth) return auth.response;
        const userId = auth.session.user.id;

        await connectToDatabase();
        if (!Shop) {
            console.warn("Shop model uninitialized");
        }


        const wishlist = await Wishlist.findOne({ userId });
        if (!wishlist || !wishlist.productIds.length) {
            return NextResponse.json({ success: true, data: [] }, { status: 200 });
        }

        const products = await Product.find({
            _id: { $in: wishlist.productIds },
            isHidden: { $ne: true },
        }).populate("shopId");
        return NextResponse.json({ success: true, data: products }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

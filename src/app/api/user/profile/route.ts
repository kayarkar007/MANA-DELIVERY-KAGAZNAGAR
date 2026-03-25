import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email: session.user.email }).select("-password");

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        const userData = {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            whatsapp: user.whatsapp || "",
            address: user.address || "",
            savedAddresses: user.savedAddresses || [],
            walletBalance: user.walletBalance || 0
        };

        return NextResponse.json({ success: true, data: userData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { action, addressData, addressId } = body;

        await connectToDatabase();
        const user = await User.findOne({ email: session.user.email });
        if (!user) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        if (action === "ADD_ADDRESS") {
            if (!user.savedAddresses) user.savedAddresses = [];
            user.savedAddresses.push(addressData);
            await user.save();
        } else if (action === "DELETE_ADDRESS") {
            if (user.savedAddresses) {
                user.savedAddresses = user.savedAddresses.filter((a: any) => a._id.toString() !== addressId);
                await user.save();
            }
        } else if (action === "SET_DEFAULT") {
            user.address = addressData.address;
            user.currentLocation = { 
                latitude: addressData.lat, 
                longitude: addressData.lng, 
                updatedAt: new Date() 
            };
            await user.save();
        }

        return NextResponse.json({ success: true, data: user });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import { requireUserFlexible } from "@/lib/routeAuth";
import User from "@/models/User";

export async function GET(req: Request) {
    try {
        const auth = await requireUserFlexible();
        if ("response" in auth) return auth.response;

        await connectToDatabase();

        const userId = auth.session.user.id;
        const user = await User.findById(userId).select("-password");

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
            walletBalance: user.walletBalance || 0,
        };

        return NextResponse.json({ success: true, data: userData });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const auth = await requireUserFlexible();
        if ("response" in auth) return auth.response;

        const body = await req.json();
        const { action, addressData, addressId, name, phone, whatsapp } = body;

        await connectToDatabase();
        const userId = auth.session.user.id;
        const user = await User.findById(userId);
        if (!user) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });

        if (action === "ADD_ADDRESS") {
            if (!user.savedAddresses) user.savedAddresses = [];
            const safeAddress = {
                label: addressData.label || "Home",
                address: addressData.address || "",
                lat: Number(addressData.lat) || 19.3315,
                lng: Number(addressData.lng) || 79.4828,
            };
            user.savedAddresses.push(safeAddress);
            await user.save();
        } else if (action === "DELETE_ADDRESS") {
            if (user.savedAddresses) {
                user.savedAddresses = user.savedAddresses.filter(
                    (a: any) => a._id.toString() !== addressId
                );
                await user.save();
            }
        } else if (action === "SET_DEFAULT") {
            user.address = addressData.address;
            user.currentLocation = {
                latitude: addressData.lat,
                longitude: addressData.lng,
                updatedAt: new Date(),
            };
            await user.save();
        } else if (action === "UPDATE_PROFILE") {
            if (name) user.name = name;
            if (phone) user.phone = phone;
            if (whatsapp !== undefined) user.whatsapp = whatsapp;
            await user.save();
        }

        return NextResponse.json({ success: true, data: {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone || "",
            whatsapp: user.whatsapp || "",
            address: user.address || "",
            savedAddresses: user.savedAddresses || [],
            walletBalance: user.walletBalance || 0,
        }});
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

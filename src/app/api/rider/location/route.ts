import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import Order from "@/models/Order";
import User from "@/models/User";

async function getRiderSession() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "rider") {
        return null;
    }

    return session;
}

export async function GET() {
    try {
        const session = await getRiderSession();

        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const rider = await User.findById(session.user.id).select("isOnDuty currentLocation");
        return NextResponse.json({
            success: true,
            data: {
                isOnDuty: Boolean(rider?.isOnDuty),
                dutyStatus: rider?.dutyStatus || "offline",
                currentLocation: rider?.currentLocation || null,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getRiderSession();

        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const { latitude, longitude } = await req.json();

        if (latitude === undefined || longitude === undefined) {
            return NextResponse.json({ success: false, error: "Missing coordinates" }, { status: 400 });
        }

        await connectToDatabase();

        await User.findByIdAndUpdate(session.user.id, {
            currentLocation: {
                latitude,
                longitude,
                updatedAt: new Date(),
            },
            isOnDuty: true,
            dutyStatus: "on_duty",
        });

        await Order.updateMany(
            { riderId: session.user.id, deliveryStatus: { $in: ["assigned", "accepted", "picked_up", "out_for_delivery"] } },
            {
                riderLocation: {
                    latitude,
                    longitude,
                },
            }
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error updating location:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const session = await getRiderSession();

        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        await User.findByIdAndUpdate(session.user.id, {
            isOnDuty: false,
            dutyStatus: "offline",
            currentBreakStartedAt: undefined,
            currentShiftStartedAt: undefined,
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}


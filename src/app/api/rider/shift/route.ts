import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import RiderShift from "@/models/RiderShift";
import RiderPayout from "@/models/RiderPayout";
import User from "@/models/User";

async function requireRider() {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "rider") {
        return null;
    }
    return session;
}

export async function GET() {
    try {
        const session = await requireRider();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const [activeShift, shifts, payouts, rider] = await Promise.all([
            RiderShift.findOne({ riderId: session.user.id, status: { $in: ["active", "on_break"] } }).sort({ startedAt: -1 }).lean(),
            RiderShift.find({ riderId: session.user.id }).sort({ startedAt: -1 }).limit(10).lean(),
            RiderPayout.find({ riderId: session.user.id }).sort({ createdAt: -1 }).limit(10).lean(),
            User.findById(session.user.id).select("dutyStatus isOnDuty currentShiftStartedAt currentBreakStartedAt totalBreakMinutes").lean(),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                activeShift,
                shifts,
                payouts,
                rider,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await requireRider();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();
        const body = await req.json();
        const action = `${body.action || ""}`.trim();

        let activeShift = await RiderShift.findOne({
            riderId: session.user.id,
            status: { $in: ["active", "on_break"] },
        }).sort({ startedAt: -1 });

        if (action === "start") {
            if (!activeShift) {
                activeShift = await RiderShift.create({
                    riderId: session.user.id,
                    status: "active",
                    startedAt: new Date(),
                });
            }

            await User.findByIdAndUpdate(session.user.id, {
                isOnDuty: true,
                dutyStatus: "on_duty",
                currentShiftStartedAt: activeShift.startedAt,
            });

            return NextResponse.json({ success: true, data: activeShift });
        }

        if (!activeShift) {
            return NextResponse.json({ success: false, error: "No active shift found" }, { status: 400 });
        }

        if (action === "break_start") {
            if (activeShift.status === "on_break") {
                return NextResponse.json({ success: false, error: "Break already started" }, { status: 400 });
            }

            activeShift.status = "on_break";
            activeShift.currentBreakStartedAt = new Date();
            await activeShift.save();

            await User.findByIdAndUpdate(session.user.id, {
                dutyStatus: "on_break",
                currentBreakStartedAt: activeShift.currentBreakStartedAt,
            });
        } else if (action === "break_end") {
            if (!activeShift.currentBreakStartedAt) {
                return NextResponse.json({ success: false, error: "No break is active" }, { status: 400 });
            }

            const breakMinutes = Math.round((Date.now() - new Date(activeShift.currentBreakStartedAt).getTime()) / 60000);
            activeShift.breakMinutes += Math.max(0, breakMinutes);
            activeShift.currentBreakStartedAt = undefined;
            activeShift.status = "active";
            await activeShift.save();

            await User.findByIdAndUpdate(session.user.id, {
                dutyStatus: "on_duty",
                currentBreakStartedAt: undefined,
                $inc: { totalBreakMinutes: Math.max(0, breakMinutes) },
            });
        } else if (action === "end") {
            if (activeShift.currentBreakStartedAt) {
                const breakMinutes = Math.round((Date.now() - new Date(activeShift.currentBreakStartedAt).getTime()) / 60000);
                activeShift.breakMinutes += Math.max(0, breakMinutes);
                activeShift.currentBreakStartedAt = undefined;
            }

            activeShift.status = "ended";
            activeShift.endedAt = new Date();
            await activeShift.save();

            if (Number(activeShift.earnings) > 0) {
                await RiderPayout.create({
                    riderId: session.user.id,
                    amount: Number(activeShift.earnings),
                    status: "pending",
                    note: `Shift payout for ${new Date(activeShift.startedAt).toLocaleDateString("en-IN")}`,
                });
            }

            await User.findByIdAndUpdate(session.user.id, {
                isOnDuty: false,
                dutyStatus: "offline",
                currentBreakStartedAt: undefined,
                currentShiftStartedAt: undefined,
                lastShiftEndedAt: activeShift.endedAt,
            });
        } else {
            return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }

        return NextResponse.json({ success: true, data: activeShift });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

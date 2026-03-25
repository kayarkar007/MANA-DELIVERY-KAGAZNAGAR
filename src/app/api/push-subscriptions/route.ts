import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectToDatabase from "@/lib/mongoose";
import PushSubscription from "@/models/PushSubscription";
import { getPublicVapidKey, sendPushToSubscription } from "@/lib/webPush";

async function requireSession() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return null;
    }
    return session;
}

export async function GET() {
    try {
        const session = await requireSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const existing = await PushSubscription.findOne({
            userId: session.user.id,
            isActive: true,
        }).select("_id");

        return NextResponse.json({
            success: true,
            data: {
                publicKey: getPublicVapidKey(),
                subscribed: Boolean(existing),
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to fetch push subscription config" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await requireSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const subscription = body?.subscription;

        if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
            return NextResponse.json({ success: false, error: "Invalid push subscription payload" }, { status: 400 });
        }

        await connectToDatabase();

        const savedSubscription = await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            {
                $set: {
                    userId: session.user.id,
                    userRole: session.user.role,
                    endpoint: subscription.endpoint,
                    expirationTime: subscription.expirationTime ?? null,
                    keys: subscription.keys,
                    userAgent: req.headers.get("user-agent") || undefined,
                    isActive: true,
                    lastUsedAt: new Date(),
                },
            },
            { new: true, upsert: true }
        );

        try {
            await sendPushToSubscription(
                {
                    endpoint: subscription.endpoint,
                    expirationTime: subscription.expirationTime ?? null,
                    keys: subscription.keys,
                },
                {
                    title: "Push Notifications Enabled",
                    body: "Localu will now alert you about orders, payments, refunds, and support updates.",
                    href: "/profile",
                    tag: "push-enabled",
                }
            );
        } catch (error) {
            console.error("Failed to send push confirmation notification", error);
        }

        return NextResponse.json({ success: true, data: savedSubscription });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to save push subscription" }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await requireSession();
        if (!session) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const endpoint = `${body?.endpoint || ""}`.trim();

        await connectToDatabase();

        const query: Record<string, any> = { userId: session.user.id };
        if (endpoint) {
            query.endpoint = endpoint;
        }

        await PushSubscription.updateMany(query, { $set: { isActive: false } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to remove push subscription" }, { status: 500 });
    }
}

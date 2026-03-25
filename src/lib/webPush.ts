import webpush from "web-push";
import connectToDatabase from "@/lib/mongoose";
import PushSubscription from "@/models/PushSubscription";

type PushPayload = {
    title: string;
    body: string;
    href?: string;
    tag?: string;
    data?: Record<string, any>;
};

let generatedKeys: { publicKey: string; privateKey: string } | null = null;

function getVapidKeys(): { publicKey: string; privateKey: string } {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
        return { publicKey, privateKey };
    }

    if (!generatedKeys) {
        generatedKeys = webpush.generateVAPIDKeys();
        console.warn("VAPID keys are not configured. Generated ephemeral keys for the current process.");
    }

    return generatedKeys!;
}

function configureWebPush() {
    const vapidKeys = getVapidKeys();
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || "mailto:support@localu.app",
        vapidKeys.publicKey,
        vapidKeys.privateKey
    );

    return vapidKeys;
}

function buildPayload(payload: PushPayload) {
    return JSON.stringify({
        title: payload.title,
        body: payload.body,
        href: payload.href || "/",
        tag: payload.tag || "localu-notification",
        icon: "/logo2.png",
        badge: "/logo.png",
        data: payload.data || {},
    });
}

async function deactivateSubscription(endpoint: string) {
    await PushSubscription.updateOne({ endpoint }, { $set: { isActive: false } });
}

export function getPublicVapidKey() {
    return configureWebPush().publicKey;
}

export async function sendPushToStoredSubscriptions(
    recipientIds: string[],
    payloadByRecipient: Map<string, PushPayload>
) {
    if (!recipientIds.length) return;

    configureWebPush();
    await connectToDatabase();

    const subscriptions = await PushSubscription.find({
        userId: { $in: recipientIds },
        isActive: true,
    }).lean();

    await Promise.all(subscriptions.map(async (subscription: any) => {
        const payload = payloadByRecipient.get(subscription.userId);
        if (!payload) return;

        try {
            await webpush.sendNotification(subscription, buildPayload(payload));
            await PushSubscription.updateOne({ _id: subscription._id }, { $set: { lastUsedAt: new Date() } });
        } catch (error: any) {
            if (error?.statusCode === 404 || error?.statusCode === 410) {
                await deactivateSubscription(subscription.endpoint);
                return;
            }

            console.error("Failed to send web push notification", error);
        }
    }));
}

export async function sendPushToSubscription(
    subscription: {
        endpoint: string;
        expirationTime?: number | null;
        keys: { p256dh: string; auth: string };
    },
    payload: PushPayload
) {
    configureWebPush();
    await webpush.sendNotification(subscription, buildPayload(payload));
}

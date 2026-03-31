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

export async function dispatchPushToUser(
    userId: string,
    payload: PushPayload
): Promise<{ success: boolean; shouldRetry: boolean }> {
    configureWebPush();
    await connectToDatabase();

    const subscriptions = await PushSubscription.find({
        userId,
        isActive: true,
    }).lean();

    if (!subscriptions.length) {
        // No active subscriptions, so we can't deliver a push. No point retrying.
        return { success: false, shouldRetry: false };
    }

    let atLeastOneSuccess = false;
    let pushServiceError = false;
    const constructedPayload = buildPayload(payload);

    await Promise.all(subscriptions.map(async (subscription: any) => {
        try {
            await webpush.sendNotification(subscription, constructedPayload);
            atLeastOneSuccess = true;
            await PushSubscription.updateOne({ _id: subscription._id }, { $set: { lastUsedAt: new Date() } });
        } catch (error: any) {
            if (error?.statusCode === 404 || error?.statusCode === 410) {
                // Subscription has expired or is no longer valid
                await deactivateSubscription(subscription.endpoint);
            } else if (error?.statusCode >= 500 || error?.statusCode === 429) {
                // Push service is down or rate limited — we should retry
                pushServiceError = true;
                console.error("Push service error", error);
            } else {
                console.error("Failed to send web push notification", error);
            }
        }
    }));

    if (pushServiceError && !atLeastOneSuccess) {
        return { success: false, shouldRetry: true };
    }

    return { success: atLeastOneSuccess, shouldRetry: false };
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

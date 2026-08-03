import connectToDatabase from "@/lib/mongoose";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { dispatchPushToUser } from "@/lib/webPush";
import { sendFCMNotification } from "@/lib/fcm";

type NotificationInput = {
    recipientId: string;
    recipientRole: "user" | "admin" | "rider";
    title: string;
    message: string;
    type?: "order" | "support" | "wallet" | "system" | "review" | "payment";
    href?: string;
    metadata?: Record<string, any>;
    dedupeHash?: string;
};

const MAX_RETRIES = 5;

function calculateBackoff(retryCount: number): Date {
    // Exponential backoff: 1m, 2m, 4m, 8m, 16m
    const backoffMinutes = Math.pow(2, retryCount - 1);
    return new Date(Date.now() + backoffMinutes * 60000);
}

export async function triggerNotification(input: NotificationInput) {
    await connectToDatabase();

    // Deduplication Check
    if (input.dedupeHash) {
        const existing = await Notification.findOne({ dedupeHash: input.dedupeHash });
        if (existing) {
            return existing; // Already processed
        }
    }

    const notification = await Notification.create({
        ...input,
        type: input.type || "system",
        status: "pending",
        retryCount: 0,
    });

    // Attempt instant delivery via Web Push (VAPID) — for browser/PWA users
    const result = await dispatchPushToUser(input.recipientId, {
        title: input.title,
        body: input.message,
        href: input.href,
        tag: `notification-${notification._id.toString()}`,
        data: {
            ...(input.metadata || {}),
            notificationId: notification._id.toString(),
            type: input.type,
        },
    });

    // Also send FCM push to mobile apps (Customer / Vendor / Rider Android apps)
    // Fire-and-forget: mobile push failure doesn't affect web push status
    (async () => {
        try {
            const userRecord = await User.findById(input.recipientId).select("fcmToken").lean() as { fcmToken?: string } | null;
            if (userRecord?.fcmToken) {
                await sendFCMNotification({
                    token: userRecord.fcmToken,
                    title: input.title,
                    body: input.message,
                    data: {
                        ...(input.metadata ? Object.fromEntries(
                            Object.entries(input.metadata).map(([k, v]) => [k, String(v)])
                        ) : {}),
                        notificationId: notification._id.toString(),
                        type: input.type || "system",
                        href: input.href || "/",
                    },
                });
            }
        } catch (fcmErr) {
            console.error("[FCM] Mobile push failed silently:", fcmErr);
        }
    })();

    if (result.success) {
        notification.status = "delivered";
        await notification.save();
    } else if (result.shouldRetry) {
        notification.retryCount = 1;
        notification.nextRetryAt = calculateBackoff(1);
        await notification.save();
    } else {
        // Did not succeed, but shouldn't retry (no subscriptions configured or active)
        notification.status = "failed";
        await notification.save();
    }

    return notification;
}

export async function notifyAdmins(
    input: Omit<NotificationInput, "recipientId" | "recipientRole">
) {
    await connectToDatabase();
    const admins = await User.find({ role: "admin" }).select("_id");
    if (!admins.length) return [];

    const notifications = await Promise.all(
        admins.map((admin) =>
            triggerNotification({
                ...input,
                recipientId: admin._id.toString(),
                recipientRole: "admin" as const,
                // Make a unique hash per admin if dedupe exists
                dedupeHash: input.dedupeHash ? `${input.dedupeHash}-${admin._id}` : undefined,
            })
        )
    );

    return notifications;
}

export async function processRetryQueue() {
    await connectToDatabase();

    const pendingNotifications = await Notification.find({
        status: "pending",
        nextRetryAt: { $lte: new Date() },
        retryCount: { $lt: MAX_RETRIES }
    }).limit(50);

    const results = {
        processed: 0,
        successes: 0,
        failed: 0,
    };

    for (const notification of pendingNotifications) {
        results.processed++;
        
        const result = await dispatchPushToUser(notification.recipientId, {
            title: notification.title,
            body: notification.message,
            href: notification.href,
            tag: `notification-${notification._id.toString()}`,
            data: {
                ...(notification.metadata || {}),
                notificationId: notification._id.toString(),
                type: notification.type,
            },
        });

        if (result.success) {
            notification.status = "delivered";
            results.successes++;
        } else if (result.shouldRetry) {
            notification.retryCount += 1;
            if (notification.retryCount >= MAX_RETRIES) {
                notification.status = "failed";
                results.failed++;
            } else {
                notification.nextRetryAt = calculateBackoff(notification.retryCount);
            }
        } else {
            notification.status = "failed";
            results.failed++;
        }

        await notification.save();
    }

    return results;
}

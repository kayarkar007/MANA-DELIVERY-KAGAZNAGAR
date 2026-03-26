import connectToDatabase from "@/lib/mongoose";
import Notification from "@/models/Notification";
import User from "@/models/User";
import { sendPushToStoredSubscriptions } from "@/lib/webPush";

type StoredPushPayload = {
    title: string;
    body: string;
    href?: string;
    tag: string;
    data?: Record<string, any>;
};

type NotificationInput = {
    recipientId: string;
    recipientRole: "user" | "admin" | "rider";
    title: string;
    message: string;
    type?: "order" | "support" | "wallet" | "system" | "review" | "payment";
    href?: string;
    metadata?: Record<string, any>;
};

export async function createNotification(input: NotificationInput) {
    await connectToDatabase();
    const notification = await Notification.create({
        ...input,
        type: input.type || "system",
    });
    await sendPushToStoredSubscriptions([input.recipientId], new Map([
        [input.recipientId, [{
            title: input.title,
            body: input.message,
            href: input.href,
            tag: `notification-${notification._id.toString()}`,
            data: {
                ...(input.metadata || {}),
                notificationId: notification._id.toString(),
            },
        }]],
    ]));
    return notification;
}

export async function createNotifications(inputs: NotificationInput[]) {
    if (!inputs.length) return [];
    await connectToDatabase();
    const notifications = await Notification.insertMany(inputs.map((input) => ({
        ...input,
        type: input.type || "system",
    })));

    const payloadsByRecipient = new Map<string, StoredPushPayload[]>();
    notifications.forEach((notification: any) => {
        const recipientPayloads = payloadsByRecipient.get(notification.recipientId) || [];
        recipientPayloads.push({
            title: notification.title,
            body: notification.message,
            href: notification.href,
            tag: `notification-${notification._id.toString()}`,
            data: {
                ...(notification.metadata || {}),
                notificationId: notification._id.toString(),
            },
        });
        payloadsByRecipient.set(notification.recipientId, recipientPayloads);
    });

    await sendPushToStoredSubscriptions(
        inputs.map((input) => input.recipientId),
        payloadsByRecipient
    );
    return notifications;
}

export async function notifyAdmins(
    input: Omit<NotificationInput, "recipientId" | "recipientRole">
) {
    await connectToDatabase();
    const admins = await User.find({ role: "admin" }).select("_id");
    if (!admins.length) return [];

    return createNotifications(
        admins.map((admin) => ({
            ...input,
            recipientId: admin._id.toString(),
            recipientRole: "admin" as const,
        }))
    );
}

import { firebaseAdminApp } from "./firebaseAdmin";
import { getMessaging, type Message } from "firebase-admin/messaging";

export interface FCMNotificationOptions {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
}

/**
 * Sends a high-priority FCM push notification to an Android device or Web app.
 */
export async function sendFCMNotification({
    token,
    title,
    body,
    data,
}: FCMNotificationOptions): Promise<{ success: boolean; error?: string }> {
    if (!firebaseAdminApp) {
        console.warn("⚠️ FCM skipped: Firebase Admin SDK not configured.");
        return { success: false, error: "Firebase Admin SDK not initialized" };
    }

    try {
        const messaging = getMessaging(firebaseAdminApp);
        const message: Message = {
            token,
            notification: {
                title,
                body,
            },
            data: data || {},
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    channelId: "mana-delivery-orders",
                    clickAction: "FLUTTER_NOTIFICATION_CLICK",
                },
            },
        };

        const response = await messaging.send(message);
        console.log("✅ FCM Notification sent successfully:", response);
        return { success: true };
    } catch (error: any) {
        console.error("❌ FCM Notification failed:", error);
        return { success: false, error: error.message };
    }
}

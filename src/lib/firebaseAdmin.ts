import { getApps, initializeApp, cert, type App } from "firebase-admin/app";

let app: App | null = null;

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
function getFormattedPrivateKey(): string | undefined {
    let key = process.env.FIREBASE_PRIVATE_KEY;
    if (!key) return undefined;

    // Strip leading/trailing quotes, escaped quotes, or commas
    key = key.trim().replace(/^["'\\]+|["'\\,]+$/g, "").replace(/\\n/g, "\n").trim();

    if (!key.startsWith("-----BEGIN PRIVATE KEY-----")) {
        const beginIdx = key.indexOf("-----BEGIN PRIVATE KEY-----");
        if (beginIdx !== -1) key = key.slice(beginIdx);
    }
    if (!key.endsWith("-----END PRIVATE KEY-----")) {
        const endIdx = key.indexOf("-----END PRIVATE KEY-----");
        if (endIdx !== -1) key = key.slice(0, endIdx + "-----END PRIVATE KEY-----".length);
    }

    return key;
}

const privateKey = getFormattedPrivateKey();

if (!getApps().length) {
    if (projectId && clientEmail && privateKey) {
        try {
            app = initializeApp({
                credential: cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            console.log("✅ Firebase Admin SDK initialized successfully");
        } catch (error) {
            console.error("❌ Error initializing Firebase Admin SDK:", error);
        }
    } else {
        console.warn("⚠️ Firebase Admin environment variables missing. FCM push notifications in fallback mode.");
    }
} else {
    app = getApps()[0];
}

export { app as firebaseAdminApp };

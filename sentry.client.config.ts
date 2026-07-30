/**
 * sentry.client.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Sentry Client-Side Error Monitoring Configuration for Mana Delivery.
 */

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function initClientSentry() {
    if (!SENTRY_DSN) {
        return;
    }

    console.log("🛡️ Initializing Client Sentry Error Monitoring");
}

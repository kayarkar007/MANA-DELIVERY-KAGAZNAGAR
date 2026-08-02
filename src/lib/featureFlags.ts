const FEATURE_ENVIRONMENT_KEYS = {
    payments: "FEATURE_PAYMENTS_ENABLED",
    promotions: "FEATURE_PROMOTIONS_ENABLED",
    pushNotifications: "FEATURE_PUSH_NOTIFICATIONS_ENABLED",
    sms: "FEATURE_SMS_ENABLED",
    vendorCatalog: "FEATURE_VENDOR_CATALOG_ENABLED",
} as const;

export type FeatureFlag = keyof typeof FEATURE_ENVIRONMENT_KEYS;

export function isFeatureEnabled(flag: FeatureFlag) {
    const value = process.env[FEATURE_ENVIRONMENT_KEYS[flag]]?.trim().toLowerCase();
    return value !== "false" && value !== "0" && value !== "off";
}

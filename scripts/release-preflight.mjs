const releaseEnvironment = process.env.RELEASE_ENV ?? "";
const isProductionRelease = releaseEnvironment === "production";
const errors = [];
const warnings = [];

function isDisabled(value) {
  return ["false", "0", "off"].includes(value?.trim().toLowerCase());
}

function isPlaceholder(value) {
  if (!value?.trim()) return true;
  return /your_|example|changeme|replace_me|xxx/i.test(value);
}

function requireValue(name, options = {}) {
  const value = process.env[name];
  if (isPlaceholder(value)) {
    errors.push(`${name} must be configured with a non-placeholder value.`);
    return;
  }
  if (options.minLength && value.length < options.minLength) {
    errors.push(`${name} must be at least ${options.minLength} characters long.`);
  }
  if (options.https && !value.startsWith("https://")) {
    errors.push(`${name} must use an https:// URL for a production release.`);
  }
}

if (!isProductionRelease) {
  console.error("Set RELEASE_ENV=production before running the release preflight.");
  process.exit(1);
}

requireValue("MONGODB_URI");
requireValue("NEXTAUTH_SECRET", { minLength: 32 });
requireValue("NEXTAUTH_URL", { https: true });
requireValue("EMAIL_USER");
requireValue("EMAIL_PASS", { minLength: 12 });

if (!isDisabled(process.env.FEATURE_PAYMENTS_ENABLED)) {
  requireValue("RAZORPAY_KEY_ID");
  requireValue("RAZORPAY_KEY_SECRET", { minLength: 16 });
  requireValue("RAZORPAY_WEBHOOK_SECRET", { minLength: 16 });
}

if (!isDisabled(process.env.FEATURE_PUSH_NOTIFICATIONS_ENABLED) && isPlaceholder(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)) {
  warnings.push("Push notifications are enabled but NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured.");
}

if (errors.length > 0) {
  console.error("Release preflight failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log("Release preflight passed for production. No secret values were printed.");
warnings.forEach((warning) => console.warn(`Warning: ${warning}`));

export const PRIVACY_POLICY_VERSION = "2026-07-31";
export const TERMS_VERSION = "2026-07-31";
export const ACCOUNT_DELETION_CONFIRMATION = "DELETE";

export function hasAcceptedCurrentPolicies(input: {
    privacyPolicyVersion?: unknown;
    termsVersion?: unknown;
}) {
    return input.privacyPolicyVersion === PRIVACY_POLICY_VERSION
        && input.termsVersion === TERMS_VERSION;
}

# Release Candidate Checklist

Use this checklist for every production release. Attach completed evidence to the release ticket; do not treat a green build alone as approval.

## Automated evidence

- [ ] CI quality gates are green: TypeScript, ESLint, production build, and production dependency audit.
- [ ] Security Evidence workflow is green: secret scan, CodeQL SAST, dependency audit, and latest CycloneDX SBOM artifact are attached.
- [ ] `RELEASE_ENV=production npm run release:preflight` passes using deployment secrets; do not paste output containing secrets into tickets.
- [ ] E2E tests run only against the dedicated `MONGODB_TEST_URI` database and report is attached.
- [ ] No open P0/P1 security, privacy, payment, or data-integrity findings remain.

## Manual security and UAT

- [ ] Verify customer, rider, vendor, and admin cannot access another role's or user's resources.
- [ ] Verify order creation, payment verification, cancellation, refund, wallet debit/credit, and delivery OTP flows.
- [ ] Verify payment webhook rejects invalid signatures and duplicate events are idempotent.
- [ ] Verify sign-up consent, data export, and account deletion in a staging account.
- [ ] Complete OWASP ASVS/MASVS checklist and record exceptions with an owner and expiry date.
- [ ] Perform staging browser/device smoke tests, accessibility keyboard review, and slow-network checkout test.

## Deployment and launch

- [ ] Database backup and restore proof is current; rollback owner and rollback command are confirmed.
- [ ] Deploy to staging, run smoke tests, then approve a limited-area or canary rollout.
- [ ] Verify payment, promotion, push, SMS, and vendor-catalog feature flags have safe rollback values.
- [ ] Monitor error rate, API latency, checkout conversion, payment success, order state ageing, and support volume for 24–72 hours.
- [ ] Product owner, technical owner, and legal owner approve go-live in writing.

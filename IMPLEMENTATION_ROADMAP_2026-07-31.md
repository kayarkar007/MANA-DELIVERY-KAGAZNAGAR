# Mana Delivery / Localu — Industry-Standard Implementation Roadmap

**Prepared:** 31 July 2026  
**Starting status:** 46/100, release blocked  
**Target:** stable, secure, measurable, mobile-ready release candidate in 10–12 weeks  
**Primary standards:** OWASP ASVS (web/API), OWASP MASVS L1 (mobile), WCAG 2.2 AA, Core Web Vitals, least privilege, secure SDLC, and production SRE practices.

> This plan is deliberately sequenced. Do not start a broad UI redesign or new features until Phase 1 release blockers and Phase 2 test-data safety are complete. “Perfect” is not a measurable release criterion; the exit gates below are.

## Program success criteria

The release candidate is approved only when all of the following are true:

- `next build`, TypeScript, lint, dependency checks, and E2E suites pass in CI.
- Web customer, admin, rider, vendor, and all four mobile apps use a single documented API/auth contract.
- Every authenticated API validates identity, role, ownership, request shape, and rate limits.
- No test may write to production data; test jobs run only against an isolated database.
- Customer checkout succeeds end-to-end in a test environment: browse → cart → address/geofence → payment/COD → admin → rider → delivery PIN → order history/refund/review.
- P0/P1 security findings are closed and mapped to an ASVS/MASVS checklist.
- Web meets WCAG 2.2 AA for critical flows and passes agreed Core Web Vitals budgets on production-like devices/networks.
- Production has dashboards, alerting, backups, rollback, privacy/legal pages, audit trails, and incident ownership.

## Work model and ownership

| Role | Accountable areas |
|---|---|
| Product owner | Scope, policy decisions, service area, UAT sign-off, legal approvals. |
| Tech lead | Architecture, sequencing, security decisions, PR/release approval. |
| Web/API engineers | Next.js, database, payments, auth, integrations, admin portal. |
| Mobile engineer | Expo apps, secure storage, deep links, device testing, store builds. |
| QA engineer | Test strategy, fixtures, automated E2E/API/accessibility/regression testing. |
| DevOps/SRE | Environments, secrets, CI/CD, observability, backups, incident response. |
| Designer/content owner | UX research, design system, accessibility, Telugu/Hindi/English content. |

Every phase ends with a demo, evidence links, a security review, and a go/no-go decision. Critical fixes should be delivered in small reviewed pull requests; do not combine refactoring, design changes, and payment/auth changes in one PR.

## Phase 0 — Governance, environments, and delivery control

**Duration:** 2–3 working days  
**Goal:** make change safe before changing application behavior.

### Implementation

- Freeze non-essential feature work until Phase 1 is complete; create a prioritized P0/P1/P2 backlog from the audit.
- Define `development`, `test`, `staging`, and `production` environments with separate MongoDB databases, Razorpay keys/webhooks, Firebase projects, email/SMS accounts, VAPID keys, and Upstash Redis instances.
- Replace accidental `.env.local` test reuse with explicit `MONGODB_TEST_URI`; CI must reject a URI/database name not marked as test.
- Move secrets to the deployment/CI secret manager. Rotate current auth, payment, mail, SMS, Firebase, Redis, and VAPID credentials after confirming no secret was exposed.
- Repair and pin the Node/npm toolchain. Commit `.nvmrc` or Volta configuration, enforce the Node LTS version in CI, and document a clean bootstrap command.
- Establish protected main branch rules: pull-request review, required checks, no direct production deploy, and release tags/changelog.
- Add `CODEOWNERS`, issue templates, severity definitions, PR template, architecture decision record (ADR) folder, and incident/change log.

### Exit gate

- A new developer can clone, install, configure a **test** environment, run lint/type/build/E2E, and deploy staging from a documented runbook.
- No test runner can connect to the production database.

## Phase 1 — Immediate release blockers and security hotfixes

**Duration:** 3–5 working days  
**Goal:** restore build integrity and eliminate high-impact security defects.

### Implementation

1. **Restore production build**
   - Correct `src/app/api/admin/orders/bulk-update/route.ts` to use the verified admin session returned by `requireAdminFlexible()`.
   - Add request schema validation for `orderIds` and `status`, Mongo ObjectId validation, maximum bulk size, and an audit history entry per affected order.
   - Add route-level tests for unauthenticated, non-admin, admin cookie, admin Bearer token, invalid input, and valid update paths.

2. **Fix rate-limit bypasses**
   - Await `signupLimiter.check`, `otpResendLimiter.check`, `forgotPasswordLimiter.check`, and `orderLimiter.check`.
   - Set `Retry-After` and consistent `429` error responses.
   - Make Redis mandatory in staging/production; in-memory fallback may exist only for local development and must emit an operational warning/metric.
   - Add deterministic tests that prove the `max + 1` request is blocked for every sensitive endpoint.

3. **Sanitize public diagnostics and errors**
   - Keep `/api/health` to a minimal public liveness response; move database latency, memory, uptime, and raw errors to an authenticated/internal readiness endpoint or monitoring agent.
   - Replace raw `error.message` API responses with stable public error codes; preserve detailed diagnostics only in server logs/Sentry.

4. **Harden security headers and secrets**
   - Remove production `script-src 'unsafe-eval'`; migrate scripts toward a nonce/hash policy where feasible.
   - Review Razorpay CSP requirements, allowed image domains, `connect-src`, HSTS deployment, cookie `Secure`/`HttpOnly`/`SameSite`, and redirect allowlists.
   - Add secret scanning and a pre-commit/CI secret gate.

### Exit gate

- TypeScript, production build, and focused security regression tests pass.
- Signup, reset, resend OTP, and order rate-limit tests return `429` beyond the configured threshold.
- No public API emits stack traces, raw database errors, or credentials.

## Phase 2 — Test foundation, safe fixtures, and CI quality gates

**Duration:** 1–2 weeks  
**Goal:** make every future change verifiable and prevent test flakiness from hiding regressions.

### Implementation

- Replace `MONGODB_URI` in Playwright setup with `MONGODB_TEST_URI`; assert a test-only database name before any `deleteMany`, `updateMany`, or upsert.
- Generate a unique `testRunId` and tag all fixture records; cleanup only that namespace in `globalTeardown`.
- Seed valid Kagaznagar coordinates from the same shared service-zone configuration used by the API. Never hard-code unrelated Hyderabad coordinates.
- Create factories for users, shops, products, orders, payments, riders, notifications, and wallet transactions.
- Remove brittle CSS/XPath selectors. Use role/name selectors where stable and add `data-testid` only for dynamic components such as drawer panels and checkout actions.
- Update stale tests: “Create Account” label, explicit Email-tab selection, current notification drawer selector, and service-zone fixture coordinates.
- Split serial mega-flows into independently setup tests; retain one full happy-path journey as a smoke test.
- Add API contract tests for every API family: auth, orders, payment, wallet, admin, rider, vendor, notifications, reviews, and support.
- Add unit tests for money calculation, geofencing, order-state transitions, inventory reservation/restore, token parsing, rate limits, and idempotency.
- Add component tests for checkout, login, password validation, notification bell, accessible dialogs, loading/error/empty states.
- Configure CI pipeline stages: install → lint → typecheck → unit → build → API/E2E → dependency audit → deploy staging → post-deploy smoke.
- Store Playwright HTML report, trace, screenshot, server log, and coverage artifacts for failed builds.

### Quality targets

- 100% P0/P1 endpoint coverage with positive and negative tests.
- At least one deterministic E2E test per role and per payment/order state transition.
- No flaky failures across 10 consecutive CI runs.
- Define coverage thresholds only after baseline; protect critical modules more strictly than UI copy/components.

### Exit gate

- CI runs all quality gates against isolated test infrastructure.
- Existing suite is green, includes a successful order workflow, and produces actionable artifacts on failure.

## Phase 3 — Unified identity, authorization, and API contract

**Duration:** 1–2 weeks  
**Goal:** one secure, documented API model for web and all mobile applications.

### Implementation

1. **Define the auth contract**
   - Keep web cookie sessions and define mobile access/refresh token flow separately, with issuer, audience, expiry, rotation, revocation, device/session ID, and role claims.
   - Do not send/store a user ID as a Bearer token. Use short-lived signed access tokens and rotating refresh tokens.
   - Store mobile secrets in Expo SecureStore/Keychain/Keystore, never AsyncStorage.
   - Design phone OTP verification to exchange a verified challenge for a real mobile session; do not let `userId + phone` become a reusable login credential.
   - Add session-management UI: signed-in devices, logout current/all devices, revocation after role/phone/password changes.

2. **Standardize authorization**
   - Implement `requireUserFlexible`, `requireRider`, `requireVendor`, and `requireAdminFlexible` consistently across all mobile-facing routes.
   - Apply role, ownership, tenant/shop, and object-level checks before every database read/write.
   - Make rider orders/location/shift use the flexible rider guard; test all methods, not just GET.
   - Decide explicitly whether admins may impersonate/access rider/vendor APIs and audit every such action.

3. **Validate every API boundary**
   - Introduce a shared schema layer (for example, Zod) for JSON/query/route parameters and response DTOs.
   - Enforce max page sizes, strict enum values, ObjectId validation, numeric boundaries, body-size limits, and safe search/regex policies.
   - Produce a versioned OpenAPI/contract document for web/mobile clients and generate typed API clients where practical.
   - Add idempotency keys to create-order, payment verification, wallet top-up, refund, status update, and notification mutation endpoints.
   - Implement consistent error format: `code`, safe `message`, correlation ID, and field errors; never expose internal error text.

### Security verification

- Map controls to OWASP ASVS: authentication, session management, access control, validation, cryptography, error handling, configuration, logging, and data protection.
- Threat-model identity flows, privilege escalation, OTP abuse, IDOR/BOLA, payment tampering, support-ticket data access, notifications, and rider location exposure.

### Exit gate

- Web, customer mobile, rider, vendor, and admin clients authenticate successfully with their documented method.
- Unauthorized, cross-user, cross-shop, expired-token, replay, malformed-token, and elevated-role attempts are rejected and logged.

## Phase 4 — Customer, rider, vendor, and admin mobile release program

**Duration:** 2–3 weeks; may start after Phase 3 contract design  
**Goal:** ship four usable, securely configured mobile apps rather than partially connected prototypes.

### Customer app

- Replace emulator-only API URL with `EXPO_PUBLIC_API_URL` configuration and release/staging/development profiles.
- Implement real mobile login/session refresh and logout using secure storage.
- Align every screen with a real API: catalog, product details, cart, checkout, order history, tracking, wallet, profile, addresses, wishlist, support, notifications, and referral.
- Either implement the missing `/wallet` endpoint/DTO or update the screen to use the intended profile/wallet endpoint.
- Complete checkout: address coordinates and serviceability, coupon, payment selection, payment result, receipt, cancellation/refund status, and accessible recovery states.

### Rider app

- Convert orders, shifts, duty, location, delivery status, and delivery OTP flows to the unified Bearer contract.
- Add foreground/background location permissions with explicit user disclosure, battery-safe update frequency, opt-out/off-duty behavior, and server-side coordinate validation.
- Validate offline/poor-network behavior: queued location/status updates, conflict policy, retry/backoff, visible sync state, and no duplicate delivery transitions.
- Test Google Maps deep links, delivery PIN flow, and safe customer-contact controls.

### Vendor and admin apps

- Verify shop isolation on products, orders, analytics, images, inventory, promos, and notifications.
- Add media upload validation, signed upload strategy, image size/type limits, moderation/audit trail, and server-side authorization.
- Confirm admin-only operations have audit logs, confirmation UX, pagination, safe bulk limits, and export privacy controls.

### Mobile platform quality

- Install and lock dependencies for all apps; run Expo diagnostics, Android release build, iOS release build, and web bundle checks.
- Configure EAS build profiles, app IDs, signing credentials, environment variable separation, OTA update policy, release versioning, and source maps/error reporting.
- Verify Android 8–current, iOS supported versions, small/large screens, dark/light modes, low-memory behavior, airplane mode, slow 3G/4G, and denied permissions.
- Execute OWASP MASVS L1 checks: secure storage, network TLS, auth/session handling, logging, privacy, platform permissions, code quality, and tamper/reverse-engineering risk assessment.

### Exit gate

- Signed staging builds of all four apps pass device acceptance testing.
- No hard-coded localhost/emulator URLs, raw user IDs as tokens, plaintext secrets, or unauthenticated privileged APIs remain.

## Phase 5 — Commerce correctness, payments, inventory, and delivery integrity

**Duration:** 1–2 weeks  
**Goal:** ensure money, stock, and order state are always correct under retry, failure, or concurrent traffic.

### Implementation

- Define one explicit order state machine for customer, admin, vendor, rider, payment, cancellation, refund, and delivery states. Keep allowed transitions in one shared server module.
- Use database transactions/atomic operations for inventory reserve/decrement/restore and wallet balance/ledger changes. Prevent overselling during concurrent checkout.
- Treat `WalletTransaction` as an immutable ledger; reconcile user balance from the ledger and add invariants/repair scripts.
- Require idempotency/replay protection for payment verify, Razorpay webhook, wallet top-up, refund, rider delivery, and notification events.
- Validate Razorpay payment/order/user/amount/currency/status linkage server-side; capture and persist gateway references and webhook event IDs.
- Verify duplicate webhook behavior, webhook replay, delayed webhook, payment success + browser close, payment failure, partial wallet balance, COD, cancellation, refund, stock restore, and chargeback/support escalation scenarios.
- Protect delivery PINs: generate cryptographically strong short-lived values, store hashes where possible, limit verification attempts, and log attempted deliveries without exposing PINs.
- Define serviceability in a configuration table instead of scattered code; support zones, fee rules, delivery-time windows, holidays, shop availability, and rider capacity.
- Build finance/admin reports that reconcile order totals, payment gateway settlements, refunds, wallet credits, and rider payouts.

### Exit gate

- Reconciliation test reports zero balance/order/payment inconsistencies across test scenarios.
- Each payment/order transition is idempotent and has an auditable actor/timestamp/correlation ID.

## Phase 6 — Performance, scalability, resilience, and data engineering

**Duration:** 2 weeks  
**Goal:** make the app fast on low-end phones and reliable under real delivery traffic.

### Web performance

- Establish synthetic and real-user monitoring for Core Web Vitals. Initial performance budgets: LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 at the 75th percentile on representative mobile traffic.
- Replace remote above-the-fold demo images with optimized owned CDN assets where possible; use correct `next/image` dimensions, responsive sizes, priority/eager loading only for true LCP images, and lazy loading elsewhere.
- Self-host/cache critical fonts or ensure build-time font availability; eliminate build dependence that breaks isolated/repeatable builds.
- Analyze bundle sizes, remove unused dependencies, dynamically import heavy maps/charts/admin-only modules, and avoid unnecessary client components.
- Add server/data caching with correct invalidation for catalog, categories, shops, SEO pages, and public lookup data. Never cache personalized, auth, payment, or order data incorrectly.

### API/database performance

- Measure endpoint p50/p95/p99 latency, error rate, and database query time; define SLOs per endpoint class.
- Add/verify MongoDB indexes from actual query patterns and production explain plans; use projections, pagination, limits, and cursors for large lists/exports.
- Prevent N+1 product/order population and cache safe read-only lookups.
- Use Redis for distributed rate limits, short-lived cache entries, idempotency keys, jobs, and retries where appropriate.
- Move long-running email/SMS/push/refund/export/reconciliation work to a durable queue with retry policy, dead-letter handling, and idempotent workers.

### Resilience and capacity

- Run load, stress, and soak tests against staging with realistic browse/login/checkout/rider-location mixes. Set capacity from measured baseline, not assumed RPS.
- Define graceful-degradation behavior for MongoDB, Redis, Razorpay, Firebase, SMS/email, image CDN, and maps outages.
- Add circuit breakers/timeouts/retries with exponential backoff and user-safe status messages.

### Exit gate

- Staging meets agreed performance budgets and no critical endpoint has an unbounded query or unbounded response.
- Load test meets documented SLO/error targets without data loss or duplicate money/order operations.

## Phase 7 — UI/UX, accessibility, localization, and trust design

**Duration:** 2–3 weeks; can run in parallel after Phase 2  
**Goal:** make the product simple, accessible, and trustworthy for customers, riders, vendors, and admins.

### Discovery and information architecture

- Conduct 8–12 moderated usability sessions across customer, rider, merchant, and admin personas in Kagaznagar/Sirpur. Test low-end Android devices and low-connectivity contexts.
- Map every critical journey: discovery, product details, cart, address/serviceability, payment, order tracking, support, cancellation/refund, rider task execution, vendor fulfillment, and admin exception handling.
- Convert findings into a prioritized UX backlog with task success rate, time-on-task, and error-rate baseline.

### Design system

- Create shared tokens for color, typography, spacing, elevation, breakpoints, touch targets, loading, error, success, warning, and destructive actions.
- Standardize reusable components: buttons, inputs, select, OTP, date/time, address, cards, drawer, modal/confirm, toast, tables, status badges, timeline, empty state, skeleton, and offline banner.
- Add clear empty/loading/error/retry states for every data view. Avoid silent failures and generic “something went wrong” without recovery action.
- Provide consistent order statuses and next-step messaging across web/mobile/admin/rider; do not expose internal status names directly to customers.

### Accessibility and localization

- Meet WCAG 2.2 AA for checkout, login, payment, order tracking, profile, support, admin actions, and mobile screens.
- Test keyboard navigation, visible focus, semantic landmarks, headings, labels, live regions/toasts, error announcements, focus traps, contrast, 200% zoom, 320px width, screen readers, and reduced motion.
- Maintain at least 44×44 CSS-pixel touch targets on mobile where appropriate.
- Define language strategy for English, Telugu, and Hindi; externalize UI strings, handle pluralization/currency/date formats, and test clipped text/RTL-resilience where applicable.

### Trust and conversion

- Make delivery radius, fees, payment options, ETA, refund/cancellation terms, shop availability, prescription requirements, and support channels clear before payment.
- Add order receipt/invoice, payment status, refund status, serviceability explanation, rider privacy notice, and support escalation UX.

### Exit gate

- Critical tasks meet agreed usability success criteria and have no WCAG AA blocker.
- Accessibility automated checks plus manual keyboard/screen-reader test evidence are attached to the release candidate.

## Phase 8 — Observability, operations, backups, and incident response

**Duration:** 1–2 weeks  
**Goal:** detect, diagnose, and recover from failures before customers report them.

### Implementation

- Integrate a real error-monitoring SDK for browser, server, worker, and mobile apps. Add release/version tags, source maps, user privacy filtering, and ownership routing.
- Use structured logs with correlation/request/order/payment IDs. Redact passwords, OTPs, tokens, payment fields, addresses, phone numbers, and email where not required.
- Create dashboards for uptime, API latency/error rate, database/Redis health, queue depth, checkout conversion, payment failures, webhooks, order state aging, rider availability, push/SMS/email failure, and mobile crash-free sessions.
- Define actionable alerts with severity, owner, runbook, escalation channel, and quiet hours. Test alert delivery.
- Configure database backup retention, point-in-time recovery where available, restore drills, export protection, and documented RPO/RTO targets.
- Add feature flags and kill switches for payment method, promotions, push, SMS, vendor catalog, and high-risk releases.
- Publish incident runbooks for payment outage, delivery outage, database outage, auth compromise, notification storm, data deletion, and security incident.

### Exit gate

- A simulated payment/database failure is detected, alerted, triaged, and rolled back/restored within agreed RTO.
- Monitoring contains no sensitive data and every P1 alert has an owner/runbook.

## Phase 9 — Privacy, policy, legal readiness, and governance

**Duration:** 1–2 weeks with legal/business owner  
**Goal:** launch with transparent customer policies and disciplined data handling.

### Implementation

- Obtain legal review for privacy notice, terms of service, refund/cancellation policy, shipping/delivery policy, vendor terms, rider policy, prescription/medicine policy, grievance/contact information, and accessibility statement.
- Build policy pages, consent capture, versioning, acceptance records, and links during signup/checkout/app onboarding.
- Define data inventory, lawful business purpose, retention/deletion schedule, access control, export/delete request workflow, and vendor/subprocessor register.
- Minimize location collection; state why rider/customer location is requested, when it is active, how long it is stored, and who can access it.
- Define audit-log retention for admin/vendor/rider status/payment/refund/catalog changes; ensure logs are immutable enough for investigations.
- Confirm Razorpay integration does not store card data and document PCI responsibilities with the payment provider.

### Exit gate

- Legal owner approves customer-facing policies and data flows.
- Privacy, consent, deletion, and audit-log controls are demonstrably implemented in staging.

## Phase 10 — Release candidate, security verification, and controlled launch

**Duration:** 1–2 weeks  
**Goal:** independently prove readiness and minimize launch risk.

### Verification program

- Run automated SAST, dependency/SBOM scan, secret scan, DAST/API scan, IaC/deployment configuration review, and license review in CI.
- Conduct manual API authorization testing for BOLA/IDOR, role escalation, mass assignment, search injection/ReDoS, upload abuse, SSRF, webhook spoofing, rate-limit abuse, CSRF, and session/token replay.
- Complete OWASP ASVS checklist for selected assurance level and OWASP MASVS L1 checklist for each mobile app; track every non-applicable control with rationale.
- Run independent penetration test for web/API/mobile before public launch if budget permits; fix all critical/high findings and retest.
- Execute UAT scripts with business owners for orders, payment/cancellation/refund, admin operations, rider delivery, vendor fulfillment, support, notifications, and policy acceptance.
- Run Lighthouse/mobile network tests, accessibility manual review, browser/device matrix, upgrade/downgrade test, and store submission validation.

### Deployment and launch

- Deploy to staging first; execute smoke test and database migration/rollback plan.
- Use canary or limited-area rollout. Keep payment/promo/push kill switches ready.
- Monitor error rate, checkout conversion, payment success, latency, order state aging, and mobile crashes for 24–72 hours.
- Hold daily launch review; only expand rollout when SLOs and support volume remain within thresholds.

### Final release gate

- Zero open P0/P1 findings.
- All mandatory CI checks green; UAT sign-off, legal sign-off, monitoring/backup proof, rollback rehearsal, and security checklist evidence are attached to the release.
- Product owner and tech lead formally approve go-live.

## Post-launch continuous improvement

**Cadence:** weekly for the first month; then monthly/quarterly.

- Review crash/error trends, Core Web Vitals, funnel conversion, order cancellations, late deliveries, payment failures, support topics, fraud/abuse signals, and customer/rider/vendor feedback.
- Ship small experiments behind feature flags; measure before expanding.
- Patch critical vulnerabilities immediately; perform monthly dependency review, quarterly access review, backup restore drill, incident exercise, and ASVS/MASVS control review.
- Maintain product analytics with a privacy-reviewed event taxonomy; measure outcomes, not vanity metrics.
- Reassess capacity, costs, vendor SLAs, and service radius as volume grows.

## Standard definition of done for every PR

- Scope, security impact, rollback plan, and acceptance criteria are stated.
- Request/response validation, authorization, error handling, logs, and rate-limit implications are reviewed.
- Unit/API/E2E tests are added or explicitly justified; test data is isolated.
- Lint, typecheck, build, relevant tests, dependency/secret scan pass in CI.
- UI change includes responsive, keyboard, screen-reader, empty/loading/error, and localization review.
- Database/index/migration, performance, observability, privacy, and documentation impacts are covered where applicable.
- Reviewer verifies no credentials, customer PII, raw OTP, raw tokens, or payment data are committed/logged.

## Suggested sequencing timeline

| Week | Main deliverable |
|---|---|
| 1 | Phase 0 and Phase 1: safe environments, green build, rate-limit fixes. |
| 2 | Phase 2: isolated fixtures, green/robust CI E2E foundation. |
| 3–4 | Phase 3: unified authentication, API schemas, authorization hardening. |
| 4–6 | Phase 4: repaired customer/rider/vendor/admin mobile contracts and staging builds. |
| 5–6 | Phase 5: payment, inventory, refund, delivery state integrity. |
| 6–7 | Phase 6: performance, queues, resilience, load testing. |
| 6–8 | Phase 7: UX/accessibility/localization improvements in parallel. |
| 8–9 | Phase 8 and 9: monitoring, backup/incident readiness, legal/privacy controls. |
| 10–12 | Phase 10: independent verification, UAT, canary release, monitored expansion. |

## Reference standards

- OWASP Application Security Verification Standard: https://devguide.owasp.org/en/06-verification/01-guides/03-asvs/
- OWASP Mobile Application Security Verification Standard: https://mas.owasp.org/MASVS/
- W3C Web Content Accessibility Guidelines 2.2: https://www.w3.org/TR/WCAG22/
- Google Core Web Vitals guidance: https://developers.google.com/search/docs/appearance/core-web-vitals

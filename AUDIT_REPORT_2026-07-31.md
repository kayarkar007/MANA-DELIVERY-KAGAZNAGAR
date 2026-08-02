# Mana Delivery / Localu — End-to-End Engineering Audit

**Audit date:** 31 July 2026  
**Release decision:** **NO-GO — not production-release ready**  
**Overall score:** **46 / 100**

## Scope and method

This audit covered the Next.js web application, 62 API route files, authentication and payment controls, the four Expo mobile codebases, CI configuration, and the existing Playwright suite. It is an engineering audit, not a formal penetration test or legal/compliance certification.

Runtime checks used the repository's local binaries and the configured Playwright MongoDB environment. No application source was modified during this audit. The repository already contained uncommitted changes before the audit began.

## Executive summary

The web application has a strong base: role-aware auth, password hashing, Razorpay signature verification, service-area geofencing, PWA support, SEO metadata, and production security headers are all present. However, three release-critical areas block launch:

1. The production build fails because the admin bulk-update API references an undefined `session` variable.
2. The customer mobile app is configured for an Android emulator URL and stores a raw user ID as a Bearer token; its protected web APIs require a NextAuth cookie session. Ordering, order history, tracking, and profile data cannot work in a release build.
3. Rider mobile Bearer JWT access fails in the real E2E suite because rider order/location/shift routes only read web-cookie sessions.

There is also a security defect in the rate-limit implementation: four async rate-limit checks are called without `await`, so the signup, resend OTP, forgot-password, and order throttles do not actually block requests.

## Scorecard

| Area | Score | Assessment |
|---|---:|---|
| Web core functionality | 58/100 | Main paths exist; complete delivery workflow was not validated because test data is outside the service zone. |
| Mobile release readiness | 10/100 | Customer auth/API integration is broken; rider Bearer workflow fails; native dependencies are absent locally. |
| Security and payments | 67/100 | Good role/payment primitives, but critical rate-limit bypass and mobile auth inconsistency remain. |
| Build and CI quality gates | 25/100 | ESLint passes, but TypeScript/production build fails and CI omits build, E2E, and SCA gates. |
| Test automation | 43/100 | 7 of 18 planned tests pass; stale locators and unsafe fixture setup reduce confidence. |
| Performance, UX, accessibility | 65/100 | Responsive/PWA and semantic controls are present; no Lighthouse/device audit and remote LCP image warning remain. |
| Operations and documentation | 50/100 | Health endpoint and some Sentry scaffolding exist; monitoring, runbooks, legal pages, and setup docs are incomplete. |

## Validation results

| Check | Result | Notes |
|---|---|---|
| ESLint | PASS | `node node_modules/eslint/bin/eslint.js .` completed cleanly. |
| TypeScript | FAIL | `TS2304: Cannot find name 'session'` in bulk order update route. |
| Production build | FAIL | Bundling succeeds with network access, then fails at the same TypeScript error. |
| Playwright web/API E2E | FAIL | 7 passed, 6 failed, 5 downstream tests did not run; 18 planned tests total. |
| Dependency vulnerability scan | NOT RUN | Global `npm` is broken (`npm-cli.js` missing) and the project has no local npm CLI. |
| Native Expo builds | NOT RUN | No `node_modules` directories are installed for any mobile app; no emulator/device build was available. |

### Playwright failure analysis

| Test outcome | Classification | Root cause |
|---|---|---|
| Password-strength UI test | Test defect | Test searches for “Sign Up”; current accessible button is “Create Account” and is correctly disabled. |
| Launch hidden-product test | Test defect | Login opens Phone mode by default; helper does not select Email mode before using email locators. |
| Mobile rider API test | Product defect | Bearer JWT returns a non-success response for rider orders; the route uses `getServerSession` only. |
| Partial wallet guard test | Fixture defect | Test GPS coordinates are ~240.64 km outside Kagaznagar, so valid geofencing rejects the request before payment validation. |
| Notification viewport test | Test defect | Test expects `z-50`; current panel uses `z-[100]` and is visibly rendered in the artifact. |
| Full role journey | Fixture defect | Initial order is correctly rejected by service-area geofencing, so three serial dependent role tests are not run. |

## Release blockers — fix before any release

### P0 — Production build is blocked

**Evidence:** `src/app/api/admin/orders/bulk-update/route.ts:31` uses `session.user.id`, but the route stores the authenticated result in `auth`. This blocks `tsc` and `next build`.

**Required fix:** use the verified `auth.session.user.id` after the existing `requireAdminFlexible()` guard, then add a focused API test and make `next build` a required CI gate.

### P0 — Customer mobile app cannot work in a release environment

**Evidence:**

- `mobile/src/api/client.js:5` hard-codes `http://10.0.2.2:3000/api`, an Android emulator-only address.
- `mobile/src/context/AuthContext.js:37` stores `data.user.id` as `userToken`, not a signed JWT.
- `src/app/api/orders/route.ts:81` calls cookie-only `requireUser()`; order history and tracking routes also use NextAuth web sessions.
- `mobile/src/screens/ProfileScreen.js:16` calls `/wallet`, but no `src/app/api/wallet/route.ts` exists.

**Impact:** customer login may appear successful, but authenticated customer APIs will return unauthorized/404 responses. A real Android/iOS release cannot reach the development emulator server.

**Required fix:** obtain/store an actual short-lived mobile access token (prefer secure device storage), support that token with a customer flexible-auth guard on every intended mobile endpoint, make the API base URL environment driven, and map the profile to an implemented wallet/profile API.

### P0 — Rider mobile workflow rejects its Bearer token

**Evidence:** Playwright mobile API test fails for `GET /api/rider/orders`. `src/lib/routeAuth.ts:87` provides `requireRider()` with Bearer support, but `src/app/api/rider/orders/route.ts:21`, `src/app/api/rider/location/route.ts:9`, and `src/app/api/rider/shift/route.ts:10` use `getServerSession()` instead.

**Impact:** the rider app cannot reliably fetch work, update location, or manage shifts using its documented JWT authentication model.

**Required fix:** consistently use the flexible rider guard for every rider-mobile route and add positive/negative Bearer tests for GET, POST, PATCH, and DELETE operations.

### P1 — Four rate limits are ineffective

**Evidence:** `rateLimit().check()` is async, but these calls omit `await`:

- `src/app/api/auth/signup/route.ts:13`
- `src/app/api/auth/resend-otp/route.ts:20`
- `src/app/api/auth/forgot-password/route.ts:16`
- `src/app/api/orders/route.ts:87`

The returned Promise is truthy, so `if (!limiter.check(...))` never throttles. The phone OTP sender correctly uses `await` at `src/app/api/auth/phone-otp/send/route.ts:16`.

**Impact:** account/OTP email spam, avoidable provider cost, and order-abuse exposure.

**Required fix:** await every limiter result, return `429` with a retry header, and add tests that submit more than the configured limit.

## High-priority audit findings

### P1 — E2E tests can write to the app's configured database

`tests/global.setup.ts:7` loads `.env.local`, connects using `MONGODB_URI` at line 218, upserts test users, and deletes matching orders, reviews, tickets, notifications, wallet records, wishlists, shifts, and payouts at lines 248–255. There is no separate `MONGODB_TEST_URI`, no database-name allowlist, and no hard failure against a production database.

**Required fix:** use a dedicated disposable test database, require `MONGODB_TEST_URI`, assert a `test` database name, and isolate every record with a run namespace.

### P1 — CI does not prove a releasable build

`.github/workflows/ci.yml` runs install, TypeScript, and ESLint only. It does not run `next build`, Playwright, mobile checks, or a dependency vulnerability scan.

**Required fix:** block merges on production build, deterministic E2E against a test database, dependency scan, and lint/type checks. Publish Playwright trace/report artifacts on failures.

### P2 — Public health endpoint reveals runtime internals

`src/app/api/health/route.ts:21–48` returns raw database error text, process uptime, and memory use to unauthenticated callers. Keep a minimal public liveness endpoint, but restrict detailed readiness diagnostics to internal monitoring and avoid returning raw error messages.

### P2 — CSP is a partial defense

`next.config.ts:78` permits both `'unsafe-inline'` and `'unsafe-eval'` for scripts. This weakens XSS mitigation. Remove `'unsafe-eval'` in production where possible and migrate inline scripts toward nonces/hashes while preserving Razorpay requirements.

### P2 — Documentation, legal, and mobile QA gaps

The README has an empty prerequisites section and no deployment, testing, environment, or mobile-release runbook. No privacy, terms, refund, shipping, cancellation, or accessibility page was found under `src/app` or `public`. These need owner/legal review for an India consumer-commerce launch; this audit does not certify legal compliance.

### P3 — Reproducibility/performance issues

- Builds depend on downloading Google Inter at build time (`src/app/layout.tsx:2`); isolated builds fail before TypeScript unless font network access is available.
- The E2E server reports a remote Unsplash product image as LCP and recommends eager loading. Run Lighthouse on production-like data and optimize above-the-fold images.
- `sentry.client.config.ts` exposes a DSN helper but does not initialize the official Sentry SDK or show server-side error capture; operational alerting is unverified.

## Positive controls confirmed

- Role-aware middleware protects checkout, profile, admin, rider, and phone-verification routes.
- Web APIs contain ownership/admin checks for orders, wallet records, wishlist, tickets, and reviews.
- Passwords and OTPs are bcrypt hashed; password policy is enforced in both UI and API.
- Razorpay order creation, payment verification, and webhook signature validation have server-side checks.
- A geofencing control correctly rejects deliveries outside the configured 15 km Kagaznagar service radius.
- Production configuration defines security headers, PWA support, SEO metadata, image allowlists, and a health check.

## Recommended remediation order

1. Fix the bulk update `session` reference; make TypeScript and production build green.
2. Fix all missing `await` calls in rate-limit checks and add abuse-rate regression tests.
3. Establish one documented mobile authentication contract; repair customer/rider endpoint guards, profile/wallet mapping, token storage, and production API URLs.
4. Separate test data from production data and correct Playwright fixture coordinates to Kagaznagar service-area coordinates.
5. Update stale Playwright locators (Create Account, Email login tab, notification panel selector) and add a full successful customer→admin→rider→delivery journey.
6. Expand CI with build, E2E, native Expo validation, dependency scanning, and artifact retention.
7. Run a release candidate on real Android/iOS devices, production-like Mongo/Razorpay test keys, and Lighthouse/accessibility scans before reconsidering release.

## Audit limitations

Not verified in this run: real Razorpay payment capture/refund, Firebase/SMS/email provider delivery, production deployment headers, database backup/restore, observability alerts, push notifications on physical devices, native Android/iOS builds, load testing, and a current package CVE report. The latter is blocked by the broken global npm installation and must be run in CI after repairing Node/npm.

# Mana Delivery / Localu — Final End-to-End Engineering Audit

**Audit date:** 31 July 2026  
**Report version:** Post-remediation v1.0  
**Release decision:** **CONDITIONAL NO-GO**  
**Engineering readiness score:** **69 / 100**

## 1. Plain-language verdict

The application is materially safer and more complete than the initial audit baseline. The previously identified build blocker, unsafe test-database handling, ineffective rate limits, inconsistent mobile bearer authentication, delivery OTP exposure risk, payment binding gaps, privacy controls, and missing release gates have been addressed in source code and static validation.

It is **not yet approved for public production launch**. The remaining blockers are mainly evidence and operational-readiness gaps rather than a currently known P0 source-code defect: final release-candidate build/E2E execution, signed mobile-device testing, real payment/provider verification, independent security testing, legal approval, backup/restore proof, load testing, and a controlled staging/canary rollout are still required.

This is an engineering audit, not a penetration-test certificate, legal opinion, PCI attestation, accessibility certification, or store-submission approval.

## 2. Scope and method

### In scope

- Next.js 16 web application, middleware, 66 API route files, MongoDB models, shared libraries, and configuration.
- Customer, rider, vendor, and admin Expo application source/configuration.
- Authentication, authorization, OTP, payment, wallet, order, delivery, refund, notification, privacy, performance, accessibility, and operational controls.
- Playwright fixtures/tests, CI workflows, release preflight, secret scan, dependency/SBOM workflow, and runbooks.

### Evidence used

- Repository review and targeted source inspection.
- Previously completed production-build verification during Phase 1.
- Latest local static verification: focused ESLint, `tsc --noEmit`, `git diff --check`, secret scan, and a production-preflight dry run.
- Existing test configuration and CI workflow review.

### Not performed in this audit

- No production database, payment gateway, SMS/email provider, Firebase, or push provider was invoked.
- No live payment capture/refund, real webhook delivery, external DAST, independent penetration test, load test, browser/device matrix, or signed mobile build was executed.
- No GitHub Actions run, CodeQL result, dependency-audit result, SBOM artifact, backup restore, or legal sign-off was observed.

## 3. Scorecard

| Domain | Score | Status | Black-and-white assessment |
|---|---:|---|---|
| Web/API core | 78/100 | Conditional | Core paths and role boundaries are implemented; final staging E2E proof is missing. |
| Authentication and authorization | 78/100 | Conditional | Cookie/Bearer contract, role checks, OTP hardening, and erased-account blocking exist; replay/IDOR testing is still required. |
| Payments, wallet, orders, delivery | 76/100 | Conditional | Idempotency/binding/state protections are present; live gateway and reconciliation evidence is absent. |
| Mobile apps | 60/100 | No-go | API configuration and token handling improved; no signed build or physical-device acceptance proof exists. |
| Security engineering | 78/100 | Conditional | Headers, rate limits, secret scan, CodeQL workflow, and safer logging exist; scans and independent testing have not run. |
| Test automation and CI | 64/100 | Conditional | Isolated test DB guard and CI gates exist; full E2E remains manually triggered and unproven in CI. |
| Performance and resilience | 65/100 | Conditional | Caching/query limits/indexes and timing exist; no performance budget or load-test evidence exists. |
| UI/UX and accessibility | 70/100 | Conditional | Dialog semantics, focus handling, labels, and reduced-motion support are improved; no manual screen-reader/device audit exists. |
| Privacy and policy | 72/100 | Conditional | Versioned consent, data export, deletion, and baseline policy pages exist; legal approval and some policy detail are pending. |
| Operations and release readiness | 50/100 | No-go | Runbooks, feature flags, preflight, security workflow, and checklist exist; alerts, restore drill, staging/canary evidence are missing. |

**Overall:** 69/100. A score is not a deployment approval. Any missing mandatory release gate keeps the decision at **NO-GO**.

## 4. What is verified as implemented

### 4.1 Identity, authorization, and abuse controls

- Password strength is enforced in the UI and sign-up API; passwords and OTPs are hashed.
- Sign-up, password reset, resend OTP, and order flows await rate-limit decisions and return retry-safe responses.
- Web cookie sessions and signed mobile Bearer access tokens share flexible role-based authorization for customer, rider, vendor, and admin routes.
- Mobile token validation checks signing secret, issuer/audience/type, expiry, and role.
- Account-deletion tombstones are checked by shared API authorization helpers, preventing erased accounts from using routes protected through those helpers.
- Public health responses avoid raw database/runtime diagnostics.
- Response correlation IDs and structured redacted logs are available for payment, OTP, and privacy operations.

### 4.2 Commerce, payments, wallet, and delivery

- Shared order and delivery state rules prevent unsupported transitions.
- Delivery OTPs use generated values with encrypted storage, an HMAC hash, expiry, and attempt limits; sensitive OTP fields are hidden by default.
- Razorpay order IDs are bound to application orders; payment verification rejects mismatched gateway orders and webhook processing is signature-checked, idempotency-aware, and logged.
- Wallet updates use transaction-aware, idempotent references. Refunds have deterministic reference IDs.
- Completed/cancelled account-deletion orders are de-identified; active orders prevent deletion until resolved.

### 4.3 Data protection and privacy controls

- Direct email/password sign-up records Privacy Policy and Terms versions with timestamps and a separate marketing opt-in.
- Customer-facing Privacy Policy and Terms pages exist.
- Authenticated customer data export is available without delivery OTP secrets.
- Account deletion removes credentials, contact details, addresses, reviews, notifications, push subscriptions, and support message content; retained finance/order records are de-identified where required.
- Export/deletion routes return non-cacheable responses and deletion requires an explicit `DELETE` confirmation.

### 4.4 Performance, accessibility, and user experience

- Public catalog/search/shop responses use bounded queries, projections, cache headers, query time limits, and supporting indexes.
- Home-page categories/shops/counts use server caching.
- Shared dialog behavior supplies focus trapping/restoration, Escape close, scroll lock, accessible labels, and reduced-motion support.
- Checkout fields have associated labels/IDs and dialogs expose appropriate semantics.

### 4.5 DevSecOps and operations

- Playwright setup/teardown refuses to use a database unless `MONGODB_TEST_URI` targets a name ending in `-test` or `_test`.
- CI includes lint, TypeScript, production build, dependency audit, optional isolated web E2E, and report artifact upload.
- Security workflow adds current-tree secret scanning, dependency audit, CycloneDX SBOM generation, and CodeQL JavaScript/TypeScript analysis.
- Production preflight validates essential environment configuration without printing secret values.
- Payment/SMS/push/promotion/vendor-catalog kill switches and an operations runbook are present.

## 5. Current release blockers

These are launch blockers even though most are evidence/operational tasks rather than confirmed code defects.

| ID | Severity | Finding | Required closure evidence |
|---|---|---|---|
| R-01 | P1 | Final candidate has not been rebuilt and run through full isolated E2E after the latest privacy/release changes. | Green production build, `MONGODB_TEST_URI` E2E report, and artifacts from the exact release commit. |
| R-02 | P1 | Four mobile clients have no signed staging-build, Android/iOS physical-device, upgrade/downgrade, or offline/slow-network acceptance evidence. | Signed build IDs, device matrix results, and MASVS L1 checklist. |
| R-03 | P1 | Razorpay payment capture, verification, refund, cancellation, and webhook retries have not been proven with staging keys and provider callbacks. | Gateway test evidence plus reconciliation report with zero unexplained balances. |
| R-04 | P1 | No independent SAST result, DAST/API scan, penetration test, or manual BOLA/IDOR authorization test evidence is attached. | CodeQL/DAST outputs, signed security checklist, and retest results for all high/critical findings. |
| R-05 | P1 | Backup, point-in-time recovery, and restore drill are documented but not proven. | Restore record with elapsed RTO, reconciliation outcome, owner, and date. |
| R-06 | P1 | Legal owner has not approved policies, consent wording, retention, payment/provider disclosures, refund/cancellation/shipping content, or grievance contact process. | Written legal approval and final public policy URLs/content. |
| R-07 | P1 | No production-like load, performance budget, Lighthouse, or capacity test evidence exists. | SLO targets, load-test report, Core Web Vitals evidence, and remediation of material regressions. |
| R-08 | P1 | Production monitoring/alerts, external error capture, alert delivery, and incident drill have not been demonstrated. | Alert test records and a simulated payment/database incident exercise. |

## 6. Residual findings and technical debt

| ID | Severity | Finding | Impact | Recommended action |
|---|---|---|---|---|
| T-01 | P1 | Google OAuth account creation does not currently record the same versioned terms/privacy acceptance as direct sign-up. | Consent evidence is incomplete for this registration channel. | Add an explicit consent step before first OAuth account activation and persist the same version fields. |
| T-02 | P2 | The internal secret scan checks current tracked/untracked files, not git history, entropy, or every provider-specific token format. | Historical or uncommon secret exposure can be missed. | Add a reviewed full-history secret scanner in CI and rotate anything found. |
| T-03 | P2 | Account deletion performs multiple independent database writes rather than one guaranteed transaction/outbox workflow. | A mid-operation database failure could leave a partially de-identified account requiring remediation. | Add transaction support where deployment topology allows, or a resumable deletion job with audit status. |
| T-04 | P2 | Account deletion is exposed only to the customer web profile; mobile apps do not yet provide the same in-app privacy controls. | Mobile-only users have a less direct data-control path. | Add native Privacy & Data screens or a support fallback with identity verification. |
| T-05 | P2 | Privacy/Terms pages are a baseline and do not yet provide standalone refund, cancellation, shipping, vendor, rider, medicine/regulated-item, accessibility, or grievance policies. | Consumer/legal disclosures may be incomplete for launch geography and catalog. | Obtain legal copy, ownership, effective dates, contact details, and publish linked policies. |
| T-06 | P2 | Observability is structured logging and runbook scaffolding, not verified third-party monitoring/alerting. | Incidents could be detected late. | Configure an error/APM provider, dashboards, retention, on-call routing, and alert tests. |
| T-07 | P2 | Full E2E is intentionally manual (`workflow_dispatch`) rather than a mandatory merge gate. | Regressions can merge without workflow coverage. | Make safe, stable E2E mandatory after test environment reliability is proven. |
| T-08 | P3 | Current mobile apps require dependency/build validation in their own workspaces. | Expo/package incompatibilities can surface late. | Add per-app install/lint/type/build checks in CI and release provenance. |

## 7. Test and verification ledger

| Check | Latest status | Meaning |
|---|---|---|
| Focused ESLint | PASS | Changed TypeScript/JavaScript source passed lint rules. |
| TypeScript (`tsc --noEmit`) | PASS | Current type graph compiles without errors. |
| Diff hygiene (`git diff --check`) | PASS | No whitespace errors found. |
| Current-tree secret scan | PASS | 381 tracked/untracked files checked against the built-in high-signal patterns. |
| Production preflight dry run | PASS | A synthetic production configuration passed required-value/HTTPS/feature checks; no real secret was used. |
| Prior Phase 1 production build | PASS | The prior build verification passed after initial blockers were repaired. |
| Final-candidate production build | NOT RUN | Must be rerun for the exact current commit before release. |
| Full Playwright web/API E2E | NOT RUN | Requires the dedicated `MONGODB_TEST_URI` and test environment. |
| GitHub CI/Security workflow execution | NOT OBSERVED | Workflow definitions exist; their first successful runs and artifacts are required. |
| Dependency audit/SBOM/CodeQL output | NOT OBSERVED | CI is configured to generate them; no result artifact was available locally. |
| Native Expo build/device validation | NOT RUN | Must be performed for all customer/rider/vendor/admin applications. |
| DAST, penetration test, load test, accessibility manual test | NOT RUN | Mandatory evidence before public launch. |

## 8. Standards alignment

| Standard / practice | Current position | Gap to close |
|---|---|---|
| OWASP ASVS (web/API) | Partial implementation: auth, input checks, payment signatures, rate limiting, headers, privacy routes, and logging controls exist. | Complete a control-by-control ASVS checklist, manual authorization tests, DAST, and independent review. |
| OWASP MASVS L1 (mobile) | Partial implementation: API base configuration, token support, release profiles, and session cleanup are in source. | Perform secure storage, TLS, permissions, logging, tamper, and device-build verification for all four apps. |
| WCAG 2.2 AA | Partial implementation: focus/dialog semantics, labels, keyboard Escape, and reduced motion improved. | Run automated axe checks plus keyboard and screen-reader tests on all critical flows. |
| Secure SDLC / supply chain | Partial implementation: lint/type/build CI, audit, SBOM, CodeQL, secret scan, and preflight are configured. | Verify workflow runs, pin/maintain actions, add review ownership, and triage findings. |
| Privacy governance | Partial implementation: consent versioning, export, deletion, and policy pages exist. | Legal sign-off, retention schedule, all channel parity, vendor/provider contracts, and deletion completion/audit process. |
| SRE / release practice | Partial implementation: flags, correlation IDs, redacted logs, runbooks, preflight, and checklist exist. | Prove backups, alerts, incident response, SLOs, canary, and rollback in staging. |

## 9. Required go-live sequence

### Before creating a release candidate

1. Add versioned consent capture to Google OAuth onboarding.
2. Configure real staging secrets and run `RELEASE_ENV=production npm run release:preflight` only in a secured CI/deployment context.
3. Verify `MONGODB_TEST_URI` points to an isolated disposable test database.
4. Run the exact release commit through production build, full E2E, CodeQL, dependency audit, SBOM, and secret scan.
5. Run manual BOLA/IDOR, role escalation, malformed/expired/replayed token, webhook spoofing, CSRF, rate-limit, upload, and search-abuse tests.

### Staging acceptance

1. Execute customer browse → sign-up/consent → login → checkout → payment → cancellation/refund → tracking → review/support flow.
2. Execute admin order/payment/refund/user operations, vendor catalogue/fulfilment operations, and rider assignment/location/OTP delivery flow.
3. Repeat key API checks with another user, role, and shop to prove access isolation.
4. Verify data export and deletion with a disposable account; verify active-order deletion is blocked and completed-order data is de-identified.
5. Run Razorpay test payment/webhook/retry/refund and reconcile database order, wallet, and payment records.
6. Produce signed staging builds for each Expo app and run a documented device/network matrix.

### Controlled launch

1. Obtain written technical, product, operations, and legal approvals.
2. Confirm current backup/restore evidence and payment/DB/auth incident contacts.
3. Launch to a small service area or user cohort with payment/promo/push/SMS kill switches ready.
4. Monitor errors, p95 API latency, payment success, checkout conversion, order ageing, cancellations, delivery failures, and support volume for 24–72 hours.
5. Expand only if all SLOs hold and no P1 incident/abuse trend appears; otherwise disable affected flags and use the rollback runbook.

## 10. Final sign-off matrix

| Owner | Approval required | Current state |
|---|---|---|
| Technical lead | Build, E2E, security, mobile, rollback evidence | Pending |
| Product owner | UAT, launch cohort, support readiness | Pending |
| Operations owner | Backup/restore, alerting, on-call, incident drill | Pending |
| Payments owner | Razorpay test/reconciliation/webhook evidence | Pending |
| Legal/privacy owner | Policies, consent, retention, disclosures, grievance process | Pending |
| Security reviewer | SAST/DAST/manual authorization/pen-test outcomes | Pending |

## 11. Conclusion

**Code remediation status:** substantially improved and suitable for a staged verification cycle.  
**Public-launch status:** **NO-GO until every P1 release blocker and the final sign-off matrix are closed with dated evidence.**

The correct next activity is not broad new feature work. It is a controlled staging release candidate: run the required tests and provider flows, collect evidence, close the residual P1/P2 issues, then make a separate go/no-go decision.

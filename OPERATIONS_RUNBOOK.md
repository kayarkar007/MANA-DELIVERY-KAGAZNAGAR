# Operations Runbook

## Service objectives

- **Availability target:** 99.9% monthly for browse, auth, checkout, and tracking APIs.
- **RPO:** 24 hours until MongoDB point-in-time recovery is configured; target 15 minutes after enablement.
- **RTO:** 4 hours for a database restore; target 60 minutes after restore drills are automated.

## Alert ownership

| Alert | Severity | Owner | First action |
| --- | --- | --- | --- |
| Payment creation/verification failures | P1 | Payments owner | Disable `FEATURE_PAYMENTS_ENABLED`, preserve webhook processing, check Razorpay status. |
| MongoDB unavailable or health endpoint degraded | P1 | Platform owner | Stop writes if needed, check Atlas status/connection limits, begin restore assessment. |
| Authentication anomaly or credential exposure | P1 | Security owner | Rotate `NEXTAUTH_SECRET`, invalidate sessions, review correlated logs. |
| Delivery/rider outage | P2 | Operations owner | Pause new assignments, contact active riders, publish support update. |
| Notification/SMS provider failure | P2 | Communications owner | Disable affected flag, use in-app/support fallback, retry only idempotent events. |
| Accidental data deletion | P1 | Platform + security owner | Freeze writes, preserve evidence, restore to isolated environment first. |

## Payment outage

1. Confirm `payment.order.create_failed` or `payment.webhook.failed` logs using `requestId` and `orderId` only; do not copy payloads, tokens, phone numbers, or signatures into tickets.
2. Set `FEATURE_PAYMENTS_ENABLED=false`; keep Razorpay webhooks enabled so already-authorized payments reconcile.
3. Check Razorpay dashboard and webhook delivery status.
4. Re-enable only after a staging payment creation, verification, replay, refund, and cancellation test succeeds.

## Database outage

1. Check `/api/health`; capture response status and `Server-Timing`, never connection strings.
2. Confirm Atlas health, connection pool saturation, and recent deployment changes.
3. Announce degraded mode: browsing may be stale; checkout, wallet, and order mutations must fail safely.
4. If restore is required, restore to an isolated project, validate order/wallet reconciliation, then cut over with approval.

## Auth compromise

1. Disable affected accounts/roles and rotate `NEXTAUTH_SECRET`, OAuth, Firebase, and provider keys as applicable.
2. Review redacted structured events by request ID and time range.
3. Notify affected users through approved channels and preserve incident evidence.

## Backup and restore drill

1. Verify automated backups and point-in-time recovery weekly in the database provider console.
2. Quarterly, restore a recent snapshot into an isolated test database.
3. Run order, wallet-ledger, payment, and user-count reconciliation before marking the drill complete.
4. Record elapsed restoration time against RTO and update this runbook.

## Release rollback

1. Disable high-risk flags before rollback where relevant.
2. Roll back to the last verified deployment and verify `/api/health`, login, browse, checkout, webhook, and rider update flows.
3. Create an incident record with release ID, request IDs, customer impact, and follow-up owner.

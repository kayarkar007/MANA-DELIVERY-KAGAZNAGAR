# CHANGELOG — Mana Delivery (Kagaznagar)

All notable changes, security patches, performance optimizations, and feature enhancements to Mana Delivery are documented in this file.

---

## [1.2.0] - 2026-07-28

### 🔒 Security (Phase 1)
- **Rate Limiting**: Implemented sliding-window rate limiter in `src/lib/rateLimit.ts` protecting Signup (5/15m), OTP Resend (3/10m), Password Reset (3/15m), and Orders (20/10m).
- **OTP Security**: Converted raw OTP storage to `bcrypt` hashes across signup, resend, and verify workflows.
- **SSRF Hardening**: Removed wildcard `hostname: "**"` in `next.config.ts`, restricting image origins to verified CDNs (Unsplash, Cloudinary, S3, Supabase, Google).
- **CSP Headers**: Configured strict `Content-Security-Policy` HTTP headers.
- **Sanitisation**: Sanitized `serviceDetails` in order API to prevent object injection attacks.

### ⚡ Performance (Phase 2)
- **Asset Compression**: Compressed oversized assets (`favicon.ico` 7.3 MB → 1.2 KB, `logo2.png` 7.3 MB → 19 KB, `og-image.png` 5.7 MB → 26 KB WebP), saving ~20.3 MB total.
- **Bundle Splitting**: Lazy-loaded `Recharts` (`AdminAnalyticsCharts`) and `LeafletMap` via `next/dynamic` to reduce initial JS payload by ~250 KB.
- **Preconnects**: Added `preconnect` & `dns-prefetch` links for Razorpay and Cloudinary CDN.
- **Image Strategy**: Applied `priority` loading for top LCP cards and `loading="lazy"` for below-the-fold listing images.

### 💳 Payments & Refunds (Phase 3)
- **Auto-Refund Engine**: Implemented `src/lib/refund.ts` to credit user wallet, dispatch HTML email, and trigger push notifications on cancellation/refunds.
- **Razorpay Webhook**: Extended webhook handler to listen to `refund.processed` events and process wallet credits automatically.
- **HTML Email Templates**: Created responsive transactional HTML email templates for Order Placement, Refunds, Rider Assignment, and Order Delivery in `src/lib/emailTemplates.ts`.

### 📱 Real-Time & Communications (Phase 4)
- **SSE Live Tracking**: Verified Server-Sent Events (SSE) stream for live order and rider location updates on `/api/orders/[id]/track`.
- **SMS Gateway**: Created `src/lib/sms.ts` supporting Fast2SMS & Twilio with automated SMS alerts for OTP and Order status updates.
- **WhatsApp Integration**: Created `src/lib/whatsapp.ts` with Meta WhatsApp Cloud API support and localized templates in **Telugu**, **Hindi**, and **English**.

### 🔍 SEO & Discoverability (Phase 5)
- **Structured Data**: Implemented JSON-LD schemas for `ProductSchema`, `ReviewSchema`, `FAQSchema`, and `BreadcrumbSchema`.
- **Product Detail Pages**: Created dedicated SEO product pages at `/product/[slug]/page.tsx` with dynamic metadata and schema rendering.
- **Product Model**: Added indexed `slug` property to Product model.
- **Localization**: Added `hreflang` metadata alternates (`te-IN`, `en-IN`).
- **Sitemap**: Programmatically index all products and stores in `sitemap.xml`.

### 📌 Phase 8 (UI/UX & Next.js 16 Fixes)
- **Firebase Phone Auth Integration**: Switched primary SMS OTP mechanism to Firebase Phone Auth (10,000 free monthly SMS OTPs) with RecaptchaVerifier and automatic server fallback.
- **Geofencing Enforcement**: Restricted all orders (Web & Android App) strictly to Kagaznagar & surrounding 15 km service zone (`19.3316° N, 79.4831° E`). Address strings and GPS coordinates outside this radius are automatically rejected.
- **Next.js 16 Compatibility**: Created `AdminAnalyticsChartsWrapper.tsx` Client Component wrapper for `next/dynamic` with `{ ssr: false }`, resolving Next.js 16 Server Component import error in `/admin`.
- **Input `autocomplete`**: Added `autoComplete="email"` and `autoComplete="current-password"` to login forms for seamless browser credential autofill.
- **Design Tokens**: Standardized login and auth cards to use `app-card` glassmorphism tokens instead of generic Tailwind gray classes.
- **Google OAuth**: Integrated Google OAuth authentication in NextAuth.
- **Rider Earnings Dashboard**: Created `/rider/earnings/page.tsx` for daily earnings, tip breakdowns, and payout history.
- **Geofencing**: Enforced 15 km delivery radius around Kagaznagar (19.3316° N, 79.4831° E) in `src/lib/geolocation.ts` and order creation.
- **Referral Program**: Implemented referral engine (`src/lib/referral.ts`) with unique codes (`MANA-XXXX`) and automatic ₹50 wallet reward on first order delivery.
- **Admin Tools**: Created Admin CSV Export (`/api/admin/orders/export`) and Bulk Order Status Update API (`/api/admin/orders/bulk-update`).

### 🛠️ DevOps & Testing (Phase 7)
- **Health Check API**: Created `/api/health/route.ts` checking MongoDB connection latency, memory usage, and uptime seconds.
- **CI/CD Pipeline**: Created GitHub Actions CI workflow in `.github/workflows/ci.yml`.
- **Unit Tests**: Added Jest unit test suites for geolocation, geofencing, and pricing calculations in `src/lib/__tests__/`.
- **Sentry Setup**: Created `sentry.client.config.ts` error monitoring setup.

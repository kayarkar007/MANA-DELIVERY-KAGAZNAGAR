import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import withPWA from "@ducanh2912/next-pwa";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const pwa = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  fallbacks: { document: "/~offline" },
});

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.*.*"],
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [40, 45, 50, 75],
    remotePatterns: [
      // Unsplash — product/shop demo images
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      // Supabase storage (if migrating assets there)
      { protocol: "https", hostname: "*.supabase.co" },
      // Cloudinary (if used for product images)
      { protocol: "https", hostname: "res.cloudinary.com" },
      // AWS S3 (generic — restrict to your bucket hostname when known)
      { protocol: "https", hostname: "*.amazonaws.com" },
      // Google user avatars (for future OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  // HTTP Security + Caching Headers (Disabled in dev mode so local IP HTTP testing works)
  async headers() {
    if (process.env.NODE_ENV === "development") {
      return [];
    }
    return [
      // Security headers for all routes
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Content-Security-Policy
            // ─────────────────────────────────────────────────────────────────
            // default-src 'self'        → only same-origin resources by default
            // script-src               → allow Next.js inline scripts (nonce not
            //                           yet implemented) + trusted CDNs
            // style-src 'unsafe-inline' → Tailwind CSS-in-JS requires inline styles
            // img-src                  → allow same-origin, data URIs, and trusted
            //                           image CDNs whitelisted in remotePatterns
            // connect-src              → allow Next.js HMR websocket in dev +
            //                           Razorpay / push subscription APIs
            // frame-ancestors 'none'   → prevents clickjacking (stronger than X-Frame-Options)
            // upgrade-insecure-requests → force HTTPS for all sub-resources
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://api.razorpay.com https://www.gstatic.com https://apis.google.com https://accounts.google.com https://www.google.com https://recaptcha.net https://www.recaptcha.net https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://images.unsplash.com https://plus.unsplash.com https://res.cloudinary.com https://*.amazonaws.com https://lh3.googleusercontent.com https://*.supabase.co",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com wss://manadelivery.in https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://fcmregistrations.googleapis.com https://www.google.com https://recaptcha.net https://www.recaptcha.net",
              "frame-src https://api.razorpay.com https://checkout.razorpay.com https://*.firebaseapp.com https://accounts.google.com https://www.google.com https://recaptcha.net https://www.recaptcha.net",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
      // Public assets are not content-hashed, so allow them to refresh after deploys.
      {
        source: "/(.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|otf))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      // Cache sitemap and robots for 24h
      {
        source: "/(sitemap.xml|robots.txt)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=43200" },
        ],
      },
      // SEO landing pages — cache for 1 hour
      {
        source:
          "/(grocery-delivery-kagaznagar|food-delivery-kagaznagar|medicine-delivery-kagaznagar|delivery-sirpur-kagaznagar|online-shopping-kagaznagar)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=1800" },
        ],
      },
    ];
  },
  // Redirect vercel.app to canonical domain
  async redirects() {
    return [
      {
        source: "/(.*)",
        has: [{ type: "host", value: "manadelivery.vercel.app" }],
        destination: "https://manadelivery.in/:path*",
        permanent: true,
      },
    ];
  },
};

export default pwa(nextConfig);

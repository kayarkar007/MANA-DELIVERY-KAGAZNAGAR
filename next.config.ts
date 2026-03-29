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
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [40, 45, 50, 75],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  outputFileTracingRoot: projectRoot,
  turbopack: {
    root: projectRoot,
  },
  // HTTP Security + Caching Headers
  async headers() {
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
        ],
      },
      // Cache static assets aggressively (images, fonts, icons)
      {
        source: "/(.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|otf))",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      // Cache _next/static chunks (JS/CSS) forever
      {
        source: "/_next/static/(.*)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
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

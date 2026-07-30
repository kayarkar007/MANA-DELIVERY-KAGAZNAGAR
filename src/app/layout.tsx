import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import WebsiteSchema from "@/components/seo/WebsiteSchema";
import PushMessageListener from "@/components/PushMessageListener";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const BASE_URL = "https://manadelivery.in";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  applicationName: "Mana Delivery",
  title: {
    default: "Mana Delivery – Grocery, Food & Medicine Delivery in Kagaznagar",
    template: "%s | Mana Delivery Kagaznagar",
  },
  description:
    "Order groceries, food, medicines & daily essentials online in Sirpur Kagaznagar. Fast hyperlocal delivery to your doorstep. Same-day delivery available! Call +91 9494378247.",
  keywords: [
    "delivery in kagaznagar",
    "grocery delivery kagaznagar",
    "food delivery kagaznagar",
    "medicine delivery kagaznagar",
    "online shopping kagaznagar",
    "sirpur kagaznagar delivery",
    "hyperlocal delivery telangana",
    "mana delivery",
    "home delivery kagaznagar",
    "same day delivery kagaznagar",
    "grocery home delivery sirpur",
    "daily essentials delivery kagaznagar",
  ],
  category: "shopping",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-IN": BASE_URL,
      "te-IN": `${BASE_URL}?lang=te`,
      "x-default": BASE_URL,
    },
  },
  openGraph: {
    title: "Mana Delivery – Fastest Delivery in Kagaznagar, Sirpur",
    description:
      "Order groceries, food, medicines & daily essentials online in Sirpur Kagaznagar. Fast hyperlocal delivery to your doorstep. Same-day delivery available!",
    siteName: "Mana Delivery",
    url: BASE_URL,
    images: [
      {
        // og-image.webp — 26 KB (was 5.5 MB .png)
        url: `${BASE_URL}/og-image.webp`,
        width: 1200,
        height: 630,
        alt: "Mana Delivery — Kagaznagar ki apni delivery service",
      },
    ],
    locale: "en_IN",
    type: "website",
    countryName: "India",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mana Delivery – Grocery & Food Delivery in Kagaznagar",
    description:
      "Fast hyperlocal delivery of groceries, food & medicines in Sirpur Kagaznagar. Order online now!",
    images: [`${BASE_URL}/og-image.webp`],
    site: "@manadelivery",
    creator: "@manadelivery",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mana Delivery",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    // NAP (Name Address Phone) consistency
    "geo.region": "IN-TG",
    "geo.placename": "Sirpur Kagaznagar",
    "geo.position": "19.1667;79.4667",
    "ICBM": "19.1667, 79.4667",
  },
  verification: {
    google: "IoKUEh7XbSc43fQ_WHPFGJVPbJ4GMjIk1TddDzo511w",
  },
};

export const viewport: Viewport = {
  themeColor: "#090405",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* Global JSON-LD structured data */}
        <LocalBusinessSchema />
        <WebsiteSchema />
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Razorpay payment SDK */}
        <link rel="preconnect" href="https://api.razorpay.com" />
        <link rel="dns-prefetch" href="https://checkout.razorpay.com" />
        {/* Cloudinary — product image CDN */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body className={`${inter.className} overflow-x-hidden font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <Toaster position="top-center" richColors />
            <PushMessageListener />
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:rounded-full focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-xs focus:font-black focus:uppercase focus:tracking-[0.18em] focus:text-white"
            >
              Skip to content
            </a>
            <ClientLayout>{children}</ClientLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

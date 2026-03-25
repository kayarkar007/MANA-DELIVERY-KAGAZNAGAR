import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://manadelivery.vercel.app"),
  title: "Mana Delivery - #1 Delivery App in Kagaznagar",
  description: "Order food, groceries & more online in Kagaznagar. Superfast local delivery right to your door with the Mana Delivery app. Vocal for Local!",
  keywords: ["Mana Delivery", "Kagaznagar Food Delivery", "Grocery Delivery Kagaznagar", "Localu Delivery App", "Online shopping Kagaznagar"],
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Mana Delivery - Fastest Delivery in Kagaznagar",
    description: "Order food, groceries, and services online in Kagaznagar. We deliver happiness instantly!",
    siteName: "Mana Delivery",
    images: [
      {
        url: "/logo2.png",
        width: 1200,
        height: 600,
        alt: "Mana Delivery Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mana Delivery",
  },
  formatDetection: {
    telephone: false,
  },
  verification: {
    google: "IoKUEh7XbSc43fQ_WHPFGJVPbJ4GMjIk1TddDzo511w",
  },
};

export const viewport: Viewport = {
  themeColor: "#090405",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
            <Toaster position="top-center" richColors />
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

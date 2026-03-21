import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  title: "Mana Delivery - Hyperlocal",
  description: "Get everything delivered with Mana Delivery.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo2.png",
    apple: "/logo2.png",
  },
  openGraph: {
    title: "Mana Delivery",
    description: "Get everything delivered to your door.",
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
    statusBarStyle: "default",
    title: "Mana Delivery",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
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
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <Toaster position="top-center" richColors />
            <ClientLayout>{children}</ClientLayout>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BranchProvider } from "@/contexts/BranchContext";
import PWAProvider from "./PWAProvider";

export const metadata: Metadata = {
  title: "ระบบสั่งอาหารออนไลน์ - ร้านอาหารไทย",
  description: "สั่งอาหารออนไลน์ได้ง่ายๆ จากร้านอาหารไทย",
  manifest: "/manifest.json",
  themeColor: "#2563EB",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "POS Food Ordering",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased">
        <LanguageProvider>
          <BranchProvider>
            <PWAProvider />
            {children}
          </BranchProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

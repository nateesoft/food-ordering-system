import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { BranchProvider } from "@/contexts/BranchContext";

export const metadata: Metadata = {
  title: "ระบบสั่งอาหารออนไลน์ - ร้านอาหารไทย",
  description: "สั่งอาหารออนไลน์ได้ง่ายๆ จากร้านอาหารไทย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        <LanguageProvider>
          <BranchProvider>
            {children}
          </BranchProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}

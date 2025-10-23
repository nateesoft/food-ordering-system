import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}

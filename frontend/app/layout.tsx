import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/features/staff-auth/providers/AuthProvider";

const geistSans = localFont({
  src: "./fonts/Geist.ttf",
  weight: "100 900",
  display: "swap",
  variable: "--font-geist-sans",
});

const geistMono = localFont({
  src: "./fonts/GeistMono.ttf",
  weight: "100 900",
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Colette - 予約・顧客管理",
  description:
    "Coletteは、飲食店の予約・顧客・席情報を共有し、来店準備とRF分析を支援するシステムです。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

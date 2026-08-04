import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AgriEarn — Daily Earning Investment Platform",
  description:
    "Invest in agriculture packages and earn daily income. White & gold platform for product investment, daily earnings, withdrawals and admin management.",
  keywords: [
    "AgriEarn",
    "investment",
    "daily earnings",
    "agriculture",
    "wheat package",
    "ETB",
    "earning platform",
  ],
  authors: [{ name: "AgriEarn" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "AgriEarn — Daily Earning Investment Platform",
    description:
      "Invest in agriculture packages and earn daily income. Secure withdrawals, transparent admin.",
    url: "https://chat.z.ai",
    siteName: "AgriEarn",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AgriEarn — Daily Earning Investment Platform",
    description: "Invest in agriculture packages and earn daily income.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

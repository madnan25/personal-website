import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mohammad Dayem Adnan — Builder of teams, products, and wins",
  description: "I build teams, products, and repeatable wins. CMO at The Vertical, Founder at Voortgang, and Head of Delivery at NettaWorks—combining design thinking and ruthless prioritization to deliver results.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon-32x32.png",
  },
  openGraph: {
    title: "Mohammad Dayem Adnan — Builder of teams, products, and wins",
    description: "I build teams, products, and repeatable wins. CMO at The Vertical, Founder at Voortgang, and Head of Delivery at NettaWorks—combining design thinking and ruthless prioritization to deliver results.",
    type: "website",
    url: "https://dayemadnan.com/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mohammad Dayem Adnan — Builder of teams, products, and wins",
    description: "I build teams, products, and repeatable wins. CMO at The Vertical, Founder at Voortgang, and Head of Delivery at NettaWorks—combining design thinking and ruthless prioritization to deliver results.",
  },
};

export const viewport = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Load Turnstile once globally to prevent duplicate loads per page */}
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" defer />
        <Providers>{children}</Providers>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

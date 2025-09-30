import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { SpeedInsights } from "@vercel/speed-insights/next";

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
  openGraph: {
    title: "Mohammad Dayem Adnan — Builder of teams, products, and wins",
    description: "I build teams, products, and repeatable wins. CMO at The Vertical, Founder at Voortgang, and Head of Delivery at NettaWorks—combining design thinking and ruthless prioritization to deliver results.",
    type: "website",
    url: "https://mdadnan.com/",
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
        <Providers>{children}</Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}

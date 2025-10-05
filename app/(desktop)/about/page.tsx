import type { Metadata } from "next";
import AboutContent from "@/components/hero/AboutContent";

export const dynamic = "error";
export const revalidate = false;

export const metadata: Metadata = {
  title: "About — Mohammad Dayem Adnan",
  description: "Builder of teams, products, and repeatable wins.",
  alternates: { canonical: "https://dayemadnan.com/about" },
  openGraph: {
    title: "About — Mohammad Dayem Adnan",
    description: "Builder of teams, products, and repeatable wins.",
    url: "https://dayemadnan.com/about",
  },
  robots: { index: true, follow: true },
  other: {
    "script:type=application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Mohammad Dayem Adnan",
      url: "https://dayemadnan.com/",
      sameAs: [
        "https://www.linkedin.com/in/mdayemadnan/",
        "https://cal.com/madnan"
      ]
    })
  }
};

export default function AboutSSR() {
  return <AboutContent />;
}



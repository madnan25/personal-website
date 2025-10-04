import type { Metadata } from "next";

export const dynamic = "error";
export const revalidate = false;

export const metadata: Metadata = {
  title: "Blog — Mohammad Dayem Adnan",
  description: "Writing on building teams, products, and practical systems.",
  alternates: { canonical: "https://dayemadnan.com/blog" },
  openGraph: {
    title: "Blog — Mohammad Dayem Adnan",
    description: "Writing on building teams, products, and practical systems.",
    url: "https://dayemadnan.com/blog",
  },
  robots: { index: true, follow: true },
};

export default function BlogIndexStub() {
  return null;
}



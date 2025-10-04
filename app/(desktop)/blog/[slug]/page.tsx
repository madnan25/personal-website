import { blogPosts } from "@/lib/blog";
import type { Metadata } from "next";

export const dynamic = "error";
export const revalidate = false;

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.id === slug);
  if (!post) return {};
  const url = `https://dayemadnan.com/blog/${slug}`;
  return {
    title: `${post.title} — Mohammad Dayem Adnan` ,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
    robots: { index: true, follow: true },
    other: {
      // Minimal JSON-LD for BlogPosting
      "script:type=application/ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        url,
        author: { "@type": "Person", name: "Mohammad Dayem Adnan" }
      })
    }
  };
}

export default async function BlogSlugStub({ params }: { params: Promise<{ slug: string }> }) {
  await params; // Ensure params is awaited
  return null;
}



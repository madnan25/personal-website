import type { Metadata } from "next";
import { blogPosts } from "@/lib/blog";

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

export default function BlogIndexSSR() {
  return (
    <article className="max-w-3xl mx-auto p-6 md:p-8">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-[var(--macos-text-primary)] mb-6">Blog</h1>
      <ul className="space-y-4">
        {blogPosts.map((p) => (
          <li key={p.id} className="border-b border-[var(--macos-border)] pb-4">
            <a href={`/blog/${p.id}`} className="text-xl text-[var(--macos-accent)] hover:underline">{p.title}</a>
            <div className="text-sm text-[var(--macos-text-tertiary)]">{new Date(p.date).toLocaleDateString()}</div>
            <p className="text-[var(--macos-text-secondary)] mt-1">{p.description}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}



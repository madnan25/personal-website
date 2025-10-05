import { blogPosts } from '@/lib/blog';
import BlogTemplate from '@/components/blog/BlogTemplate';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'error';
export const revalidate = false;

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.id === slug);
  if (!post) return { robots: { index: false, follow: false } };
  const url = `https://dayemadnan.com/blog/${slug}`;
  return {
    title: `${post.title} — Mohammad Dayem Adnan`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title: post.title, description: post.description },
    robots: { index: true, follow: true },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = blogPosts.find((p) => p.id === slug);
  if (!meta) notFound();

  let content = meta.content;
  if (!content || content.length === 0) {
    if (slug === 'in-defense-of-bubbles') {
      const mod = await import('@/lib/posts/in-defense-of-bubbles');
      content = mod.content;
    } else if (slug === 'build-things-that-matter') {
      const mod = await import('@/lib/posts/build-things-that-matter');
      content = mod.content;
    }
  }

  if (!content || content.length === 0) notFound();

  return <BlogTemplate post={{ ...meta, content }} />;
}



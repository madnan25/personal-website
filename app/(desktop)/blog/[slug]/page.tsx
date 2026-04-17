import { blogPosts } from '@/lib/blog';
import BlogTemplate from '@/components/blog/BlogTemplate';
import { getPostHtml } from '@/lib/blog/server';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'error';
export const revalidate = false;

const SITE_URL = 'https://dayemadnan.com';
const AUTHOR_URL = `${SITE_URL}/about`;

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.id === slug);
  if (!post) return { robots: { index: false, follow: false } };
  const url = `${SITE_URL}/blog/${slug}`;
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
  const loaded = await getPostHtml(slug);
  if (!loaded) notFound();

  const url = `${SITE_URL}/blog/${slug}`;
  // Single JSON-LD using schema.org @graph covers both BlogPosting + BreadcrumbList,
  // producing one real <script type="application/ld+json"> that Google will index.
  // (metadata.other renders a <meta> tag, which is invalid for structured data.)
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        headline: loaded.meta.title,
        description: loaded.meta.description,
        datePublished: loaded.meta.date,
        dateModified: loaded.meta.date,
        author: { '@type': 'Person', name: 'Mohammad Dayem Adnan', url: AUTHOR_URL },
        publisher: { '@type': 'Person', name: 'Mohammad Dayem Adnan', url: AUTHOR_URL },
        mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: loaded.meta.title, item: url },
        ],
      },
    ],
  };

  return (
    <>
      {/*
        JSON-LD structured data. Content is a plain object serialized with
        JSON.stringify — no user input, no HTML — so this dangerouslySetInnerHTML
        use is safe. This is the pattern Next.js documents for JSON-LD.
      */}
      <script
        type="application/ld+json"
        // NOSONAR: serialized structured data only; no HTML or user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BlogTemplate meta={loaded.meta} html={loaded.html} />
    </>
  );
}

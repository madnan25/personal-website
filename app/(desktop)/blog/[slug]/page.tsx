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
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      '@type': 'Person',
      name: 'Mohammad Dayem Adnan',
      url: AUTHOR_URL,
    },
    publisher: {
      '@type': 'Person',
      name: 'Mohammad Dayem Adnan',
      url: AUTHOR_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
  return {
    title: `${post.title} — Mohammad Dayem Adnan`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: { title: post.title, description: post.description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title: post.title, description: post.description },
    robots: { index: true, follow: true },
    other: {
      'script:type=application/ld+json': JSON.stringify(articleJsonLd),
    },
  };
}

export default async function BlogPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const loaded = await getPostHtml(slug);
  if (!loaded) notFound();

  const url = `${SITE_URL}/blog/${slug}`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: loaded.meta.title, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogTemplate meta={loaded.meta} html={loaded.html} />
    </>
  );
}

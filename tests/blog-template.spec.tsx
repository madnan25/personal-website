import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import BlogTemplate from '../components/blog/BlogTemplate';
import type { BlogPostMeta } from '../lib/blog';

const meta: BlogPostMeta = {
  id: 'sample',
  title: 'Sample Post',
  description: 'A test post',
  date: '2025-10-04',
  readingMinutes: 5,
};

describe('BlogTemplate', () => {
  it('renders the title, date, and reading minutes', () => {
    const html = renderToStaticMarkup(<BlogTemplate meta={meta} html="<p>Hi.</p>" />);
    expect(html).toContain('Sample Post');
    expect(html).toContain('5 min read');
  });

  it('injects the supplied html inside the blog-prose wrapper', () => {
    const html = renderToStaticMarkup(
      <BlogTemplate meta={meta} html="<h2>Heading</h2><p>Body paragraph.</p>" />
    );
    expect(html).toContain('class="blog-prose"');
    expect(html).toContain('<h2>Heading</h2>');
    expect(html).toContain('<p>Body paragraph.</p>');
  });
});

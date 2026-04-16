export interface BlogPostMeta {
  id: string; // slug
  title: string;
  description: string;
  date: string; // ISO
  readingMinutes: number;
}

export const blogPosts: BlogPostMeta[] = [
  {
    id: 'in-defense-of-bubbles',
    title: 'In Defense of Bubbles',
    description:
      'Bubbles look messy, but they upgrade the infrastructure, methods, and people that power the next decade.',
    date: '2025-10-04',
    readingMinutes: 7,
  },
  {
    id: 'build-things-that-matter',
    title: 'Build Things That Matter',
    description:
      'On using AI as an apprentice, shipping narrow tools that remove real pain, and measuring value with ruthless clarity.',
    date: '2025-09-29',
    readingMinutes: 9,
  },
];

export const VALID_POST_SLUG_REGEX = /^[a-z0-9-]{1,64}$/;

export function isValidSlug(slug: string): boolean {
  return VALID_POST_SLUG_REGEX.test(slug);
}

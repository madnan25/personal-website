export type BlogBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] };

export interface BlogPost {
  id: string; // slug
  title: string;
  description: string;
  date: string; // ISO
  readingMinutes: number;
  content: BlogBlock[];
}

export const blogPosts: BlogPost[] = [
  {
    id: 'in-defense-of-bubbles',
    title: 'In Defense of Bubbles',
    description:
      'Bubbles look messy, but they upgrade the infrastructure, methods, and people that power the next decade.',
    date: '2025-10-04',
    readingMinutes: 7,
    // File-based content to avoid bundling large blocks in client
    content: [],
  },
  {
    id: 'build-things-that-matter',
    title: 'Build Things That Matter',
    description:
      'On using AI as an apprentice, shipping narrow tools that remove real pain, and measuring value with ruthless clarity.',
    date: '2025-09-29',
    readingMinutes: 9,
    // File-based content to avoid bundling large blocks in client
    content: [],
  },
];



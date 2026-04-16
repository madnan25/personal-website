import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { blogPosts, isValidSlug, type BlogPostMeta } from "@/lib/blog";

const contentDir = path.resolve(process.cwd(), "content", "blog");

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

export interface LoadedPost {
  meta: BlogPostMeta;
  html: string;
}

export async function getPostHtml(slug: string): Promise<LoadedPost | null> {
  if (!isValidSlug(slug)) return null;
  const meta = blogPosts.find((p) => p.id === slug);
  if (!meta) return null;

  const resolved = path.resolve(contentDir, `${slug}.mdx`);
  if (resolved !== contentDir && !resolved.startsWith(contentDir + path.sep)) {
    return null;
  }

  let raw: string;
  try {
    raw = await fs.readFile(resolved, "utf8");
  } catch {
    return null;
  }

  const { content } = matter(raw);
  const file = await processor.process(content);
  const html = String(file);

  return { meta, html };
}

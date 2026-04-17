import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { Fragment, type ReactNode } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import type { Root as HastRoot } from "hast";
import { blogPosts, isValidSlug, type BlogPostMeta } from "@/lib/blog";

const contentDir = path.resolve(process.cwd(), "content", "blog");

const htmlProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify);

const hastProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype);

async function readPostRaw(slug: string): Promise<string | null> {
  if (!isValidSlug(slug)) return null;
  const resolved = path.resolve(contentDir, `${slug}.mdx`);
  if (resolved !== contentDir && !resolved.startsWith(contentDir + path.sep)) {
    return null;
  }
  try {
    return await fs.readFile(resolved, "utf8");
  } catch {
    return null;
  }
}

export interface LoadedPostHtml {
  meta: BlogPostMeta;
  html: string;
}

export interface LoadedPostNode {
  meta: BlogPostMeta;
  body: ReactNode;
}

// Used by the /api/blog/[slug] route to serve HTML over JSON for client consumers.
export async function getPostHtml(slug: string): Promise<LoadedPostHtml | null> {
  const meta = blogPosts.find((p) => p.id === slug);
  if (!meta) return null;
  const raw = await readPostRaw(slug);
  if (raw === null) return null;
  const { content } = matter(raw);
  const file = await htmlProcessor.process(content);
  return { meta, html: String(file) };
}

// Used by the SSR blog page to render MDX as a React tree (no dangerouslySetInnerHTML).
export async function getPostNode(slug: string): Promise<LoadedPostNode | null> {
  const meta = blogPosts.find((p) => p.id === slug);
  if (!meta) return null;
  const raw = await readPostRaw(slug);
  if (raw === null) return null;
  const { content } = matter(raw);
  const mdast = hastProcessor.parse(content);
  const hast = (await hastProcessor.run(mdast)) as HastRoot;
  const body = toJsxRuntime(hast, { Fragment, jsx, jsxs });
  return { meta, body };
}

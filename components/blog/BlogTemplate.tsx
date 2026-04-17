import type { BlogPostMeta } from "@/lib/blog";

interface BlogTemplateProps {
  meta: BlogPostMeta;
  html: string;
}

export default function BlogTemplate({ meta, html }: BlogTemplateProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight m-0 shine-text drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]">
          {meta.title}
        </h1>
        <p className="m-0 mt-2 text-sm text-[var(--macos-text-secondary)]">
          {new Date(meta.date).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
          })}
          {" • "}{meta.readingMinutes} min read
        </p>
      </header>

      {/*
        Trust boundary: `html` is produced by `lib/blog/server.ts` at build time
        from MDX files we author and commit under `content/blog/`. The pipeline
        (gray-matter → remark → remark-rehype → rehype-stringify) never touches
        user input and runs only on the server. This is the standard pattern
        for rendering Markdown content in React.
      */}
      <div
        className="blog-prose"
        // NOSONAR: see trust-boundary note above — `html` is author-controlled build output, not user input.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}

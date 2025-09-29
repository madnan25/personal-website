import { BlogBlock, BlogPost } from "@/lib/blog";

interface BlogTemplateProps {
  post: BlogPost;
}

export default function BlogTemplate({ post }: BlogTemplateProps) {
  return (
    <article className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight m-0 shine-text drop-shadow-[0_1px_0_rgba(255,255,255,0.25)]">
          {post.title}
        </h1>
        <p className="m-0 mt-2 text-sm text-[var(--macos-text-secondary)]">
          {new Date(post.date).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric'
          })}
          {" • "}{post.readingMinutes} min read
        </p>
      </header>

      <section className="space-y-6 md:space-y-8">
        {post.content.map((block, idx) => (
          <BlockRenderer key={idx} block={block} />
        ))}
      </section>
    </article>
  );
}

function BlockRenderer({ block }: { block: BlogBlock }) {
  if (block.type === 'heading') {
    const Tag = block.level === 2 ? 'h2' : 'h3';
    const cls = block.level === 2
      ? 'text-2xl md:text-3xl font-semibold tracking-tight text-[var(--macos-accent)] mt-10 mb-2'
      : 'text-xl md:text-2xl font-medium tracking-tight text-[var(--macos-accent)] mt-8 mb-1';
    if (block.level === 2) {
      return (
        <div>
          <Tag className={cls}>{block.text}</Tag>
          <div className="h-[2px] w-12 bg-[var(--macos-accent)] rounded-full" />
        </div>
      );
    }
    return <Tag className={cls}>{block.text}</Tag>;
  }
  if (block.type === 'quote') {
    return (
      <blockquote className="rounded-xl border border-[var(--macos-accent)]/30 bg-[var(--macos-accent)]/10 p-4 md:p-5 italic text-[var(--macos-text-secondary)]">
        {block.text}
      </blockquote>
    );
  }
  return (
    <p className="text-base md:text-lg leading-8 text-[var(--macos-text-secondary)]">
      {block.text}
    </p>
  );
}



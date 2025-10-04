import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import matter from 'gray-matter'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await context.params
    const filePath = path.join(process.cwd(), 'content', 'blog', `${slug}.mdx`)
    const raw = await fs.readFile(filePath, 'utf8')
    const { content, data } = matter(raw)

    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(content)

    const html = String(file)

    return NextResponse.json({ html, frontmatter: data })
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
}

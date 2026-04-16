import { NextRequest, NextResponse } from 'next/server'
import { getPostHtml } from '@/lib/blog/server'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params
  const loaded = await getPostHtml(slug)
  if (!loaded) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ meta: loaded.meta, html: loaded.html })
}

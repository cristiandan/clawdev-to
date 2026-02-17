import { prisma } from '@/lib/db/prisma'
import { PostStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: { publishedAt: 'desc' },
    take: 50,
    include: {
      userAuthor: { select: { name: true } },
      botAuthor: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  })

  const siteUrl = 'https://clawdev.to'
  const feedUrl = `${siteUrl}/feed.xml`

  const rssItems = posts.map(post => {
    const authorName = post.authorType === 'BOT' 
      ? post.botAuthor?.name 
      : post.userAuthor?.name
    const description = post.excerpt || post.body.slice(0, 300).replace(/[#*`\n]/g, '').trim()
    const categories = post.tags.map(pt => `<category>${escapeXml(pt.tag.name)}</category>`).join('\n      ')

    return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/posts/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/posts/${post.slug}</guid>
      <description>${escapeXml(description)}</description>
      <pubDate>${post.publishedAt?.toUTCString() || post.createdAt.toUTCString()}</pubDate>
      ${authorName ? `<author>${escapeXml(authorName)}</author>` : ''}
      ${categories}
    </item>`
  }).join('')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>clawdev.to</title>
    <link>${siteUrl}</link>
    <description>Tutorials, skills, and workflows for the Clawdbot ecosystem. Where humans and bots build together.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`

  return new Response(rss.trim(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

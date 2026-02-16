import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { PostFormat, PostStatus } from '@prisma/client'

// GET /api/v1/posts/search - Full-text search on published posts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const format = searchParams.get('format') as PostFormat | null
  const tag = searchParams.get('tag')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  if (!query) {
    return NextResponse.json({ error: 'Search query (q) is required' }, { status: 400 })
  }

  const where: any = {
    status: PostStatus.PUBLISHED,
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { body: { contains: query, mode: 'insensitive' } },
    ],
  }

  if (format) {
    where.format = format
  }

  if (tag) {
    where.tags = {
      some: {
        tag: {
          slug: tag.toLowerCase(),
        },
      },
    }
  }

  const posts = await prisma.post.findMany({
    where,
    take: limit,
    skip: offset,
    orderBy: { publishedAt: 'desc' },
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  })

  const response = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.body.slice(0, 200),
    format: post.format,
    authorType: post.authorType,
    authorName: post.authorType === 'USER' 
      ? post.userAuthor?.name 
      : post.botAuthor?.name,
    authorAvatar: post.authorType === 'USER'
      ? post.userAuthor?.image
      : post.botAuthor?.avatar,
    ownerName: post.owner.name,
    tags: post.tags.map(pt => pt.tag.name),
    publishedAt: post.publishedAt?.toISOString() || null,
  }))

  return NextResponse.json({
    query,
    count: response.length,
    results: response,
  })
}

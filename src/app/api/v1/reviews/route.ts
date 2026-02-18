import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBotAuth } from '@/lib/auth/bot-auth'
import { PostFormat, PostStatus } from '@prisma/client'

// GET /api/v1/reviews - List drafts/pending for review (owner's posts via bot auth)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as PostStatus | null
  const format = searchParams.get('format') as PostFormat | null
  const search = searchParams.get('q')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const page = parseInt(searchParams.get('page') || '1')
  const offset = parseInt(searchParams.get('offset') || '0')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  // Calculate offset from page if page is provided
  const effectiveOffset = searchParams.has('page') ? (page - 1) * limit : offset

  // Bot auth required - owner gets to see all their posts
  const result = await requireBotAuth(request)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  
  const ownerId = result.bot.ownerId

  // Build where clause
  const where: any = {
    ownerId,
  }

  // Default to DRAFT + PENDING_REVIEW if no status specified
  if (status) {
    where.status = status
  } else {
    where.status = { in: [PostStatus.DRAFT, PostStatus.PENDING_REVIEW] }
  }

  if (format) {
    where.format = format
  }

  if (search) {
    where.AND = where.AND || []
    where.AND.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ]
    })
  }

  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }
  }

  // Build orderBy
  const orderBy: any = {}
  if (['createdAt', 'publishedAt', 'title'].includes(sortBy)) {
    orderBy[sortBy] = sortOrder
  } else {
    orderBy.createdAt = 'desc'
  }

  // Get total count
  const total = await prisma.post.count({ where })

  // Get posts
  const posts = await prisma.post.findMany({
    where,
    orderBy,
    take: limit,
    skip: effectiveOffset,
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  })

  // Get status counts for the owner
  const statusCounts = await prisma.post.groupBy({
    by: ['status'],
    where: { ownerId },
    _count: { status: true },
  })

  const counts = {
    all: statusCounts.reduce((acc, s) => acc + s._count.status, 0),
    draft: statusCounts.find(s => s.status === 'DRAFT')?._count.status || 0,
    pending: statusCounts.find(s => s.status === 'PENDING_REVIEW')?._count.status || 0,
    published: statusCounts.find(s => s.status === 'PUBLISHED')?._count.status || 0,
    archived: statusCounts.find(s => s.status === 'ARCHIVED')?._count.status || 0,
  }

  const data = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.body.slice(0, 200),
    body: post.body,
    format: post.format,
    status: post.status,
    authorType: post.authorType,
    authorId: post.authorType === 'USER' ? post.userAuthorId : post.botAuthorId,
    authorName: post.authorType === 'USER' 
      ? post.userAuthor?.name 
      : post.botAuthor?.name,
    authorAvatar: post.authorType === 'USER'
      ? post.userAuthor?.image
      : post.botAuthor?.avatar,
    ownerId: post.ownerId,
    ownerName: post.owner.name,
    tags: post.tags.map(pt => pt.tag.name),
    createdAt: post.createdAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() || null,
    previewUrl: `https://www.clawdev.to/preview/${post.id}`,
  }))

  return NextResponse.json({
    data,
    counts,
    pagination: {
      total,
      page: searchParams.has('page') ? page : Math.floor(effectiveOffset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: effectiveOffset + posts.length < total,
    },
  })
}

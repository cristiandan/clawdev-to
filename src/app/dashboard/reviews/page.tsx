import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { PostStatus, PostFormat } from '@prisma/client'
import { ReviewsClient } from './reviews-client'

export const dynamic = 'force-dynamic'

interface SearchParams {
  page?: string
  limit?: string
  status?: string
  format?: string
  q?: string
  sortBy?: string
  sortOrder?: string
  dateFrom?: string
  dateTo?: string
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = parseInt(params.limit || '10')
  const status = params.status as PostStatus | undefined
  const format = params.format as PostFormat | undefined
  const search = params.q
  const sortBy = params.sortBy || 'createdAt'
  const sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc'
  const dateFrom = params.dateFrom
  const dateTo = params.dateTo

  // Build where clause
  const where: any = {
    ownerId: session.user.id,
  }

  // Default to showing DRAFT and PENDING_REVIEW if no status specified
  if (status) {
    where.status = status
  } else {
    where.status = { in: [PostStatus.DRAFT, PostStatus.PENDING_REVIEW] }
  }

  if (format) {
    where.format = format
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { body: { contains: search, mode: 'insensitive' } },
    ]
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
  if (['createdAt', 'title'].includes(sortBy)) {
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
    skip: (page - 1) * limit,
    include: {
      botAuthor: { select: { id: true, name: true, avatar: true } },
      userAuthor: { select: { id: true, name: true, image: true } },
      tags: { include: { tag: true } },
    },
  })

  // Get counts by status for the filter badges
  const statusCounts = await prisma.post.groupBy({
    by: ['status'],
    where: { ownerId: session.user.id },
    _count: { status: true },
  })

  const counts = {
    all: statusCounts.reduce((acc, s) => acc + s._count.status, 0),
    draft: statusCounts.find(s => s.status === 'DRAFT')?._count.status || 0,
    pending: statusCounts.find(s => s.status === 'PENDING_REVIEW')?._count.status || 0,
    published: statusCounts.find(s => s.status === 'PUBLISHED')?._count.status || 0,
    archived: statusCounts.find(s => s.status === 'ARCHIVED')?._count.status || 0,
  }

  const serializedPosts = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.body.slice(0, 300),
    format: post.format as string,
    status: post.status as string,
    authorType: post.authorType as string,
    authorName: (post.authorType === 'USER' ? post.userAuthor?.name : post.botAuthor?.name) || null,
    authorAvatar: (post.authorType === 'USER' ? post.userAuthor?.image : post.botAuthor?.avatar) || null,
    tags: post.tags.map(pt => pt.tag.name),
    createdAt: post.createdAt.toISOString(),
  }))

  return (
    <Suspense fallback={<div className="container py-8">Loading...</div>}>
      <ReviewsClient
        posts={serializedPosts}
        pagination={{
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }}
        counts={counts}
        filters={{
          status: status || '',
          format: format || '',
          q: search || '',
          sortBy,
          sortOrder,
          dateFrom: dateFrom || '',
          dateTo: dateTo || '',
        }}
      />
    </Suspense>
  )
}

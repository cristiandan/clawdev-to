import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { PostStatus } from '@prisma/client'
import { DashboardPostsClient } from './posts-client'

export const dynamic = 'force-dynamic'

interface SearchParams {
  page?: string
  limit?: string
  status?: string
  q?: string
}

export default async function DashboardPostsPage({
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
  const limit = parseInt(params.limit || '20')
  const status = params.status as PostStatus | undefined
  const search = params.q

  const where: any = {
    ownerId: session.user.id,
  }

  if (status) {
    where.status = status
  } else {
    where.status = { not: 'ARCHIVED' }
  }

  if (search) {
    where.title = { contains: search, mode: 'insensitive' }
  }

  const total = await prisma.post.count({ where })

  const [posts, user] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: (page - 1) * limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        format: true,
        createdAt: true,
        authorType: true,
        pinnedAt: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    }),
  ])

  const isAdmin = user?.role === 'ADMIN'

  // Get counts by status
  const statusCounts = await prisma.post.groupBy({
    by: ['status'],
    where: { ownerId: session.user.id },
    _count: { status: true },
  })

  const counts = {
    all: statusCounts.filter(s => s.status !== 'ARCHIVED').reduce((acc, s) => acc + s._count.status, 0),
    draft: statusCounts.find(s => s.status === 'DRAFT')?._count.status || 0,
    pending: statusCounts.find(s => s.status === 'PENDING_REVIEW')?._count.status || 0,
    published: statusCounts.find(s => s.status === 'PUBLISHED')?._count.status || 0,
    archived: statusCounts.find(s => s.status === 'ARCHIVED')?._count.status || 0,
  }

  const serializedPosts = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status as string,
    format: post.format as string,
    createdAt: post.createdAt.toISOString(),
    authorType: post.authorType as string,
    isPinned: post.pinnedAt !== null,
  }))

  return (
    <Suspense fallback={<div className="container py-8">Loading...</div>}>
      <DashboardPostsClient
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
          q: search || '',
        }}
        isAdmin={isAdmin}
      />
    </Suspense>
  )
}

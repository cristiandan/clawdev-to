import Link from 'next/link'
import { Suspense } from 'react'
import { prisma } from '@/lib/db/prisma'
import { PostCard } from '@/components/posts/post-card'
import { PostStatus } from '@prisma/client'
import { Pagination } from '@/components/ui/pagination'
import { PostsClient } from './posts-client'

export const dynamic = 'force-dynamic'

interface SearchParams {
  page?: string
  limit?: string
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = parseInt(params.limit || '20')

  const where = { status: PostStatus.PUBLISHED }

  const total = await prisma.post.count({ where })

  const posts = await prisma.post.findMany({
    where,
    orderBy: { publishedAt: 'desc' },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  })

  const serializedPosts = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.body.slice(0, 200),
    body: post.body,
    format: post.format,
    authorType: post.authorType,
    authorName: post.authorType === 'USER' 
      ? post.userAuthor?.name || 'Anonymous'
      : post.botAuthor?.name || 'Bot',
    authorAvatar: post.authorType === 'USER'
      ? post.userAuthor?.image ?? null
      : post.botAuthor?.avatar ?? null,
    ownerName: post.owner.name ?? null,
    tags: post.tags.map(pt => pt.tag.name),
    publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    viewCount: post.viewCount,
  }))

  return (
    <Suspense fallback={<div className="container py-8">Loading...</div>}>
      <PostsClient
        posts={serializedPosts}
        pagination={{
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        }}
      />
    </Suspense>
  )
}

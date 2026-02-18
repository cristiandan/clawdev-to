import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { Badge } from '@/components/ui/badge'
import { PostStatus } from '@prisma/client'
import { TagPageClient } from './tag-client'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string; limit?: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  })

  if (!tag) {
    return { title: 'Tag Not Found' }
  }

  const title = `#${tag.name}`
  const description = tag.description || `Browse ${tag._count.posts} posts tagged with #${tag.name} on clawdev.to`
  const url = `https://clawdev.to/tags/${tag.slug}`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | clawdev.to`,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: `${title} | clawdev.to`,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default async function TagPage({ params, searchParams }: Params) {
  const { slug } = await params
  const { page: pageParam, limit: limitParam } = await searchParams

  const page = parseInt(pageParam || '1')
  const limit = parseInt(limitParam || '20')

  const tag = await prisma.tag.findUnique({
    where: { slug },
  })

  if (!tag) {
    notFound()
  }

  // Count total posts for this tag
  const total = await prisma.postTag.count({
    where: {
      tagId: tag.id,
      post: { status: PostStatus.PUBLISHED },
    },
  })

  // Get paginated posts
  const postTags = await prisma.postTag.findMany({
    where: {
      tagId: tag.id,
      post: { status: PostStatus.PUBLISHED },
    },
    include: {
      post: {
        include: {
          userAuthor: { select: { id: true, name: true, image: true } },
          botAuthor: { select: { id: true, name: true, avatar: true } },
          owner: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
      },
    },
    orderBy: {
      post: { publishedAt: 'desc' },
    },
    take: limit,
    skip: (page - 1) * limit,
  })

  const posts = postTags.map(pt => ({
    id: pt.post.id,
    title: pt.post.title,
    slug: pt.post.slug,
    excerpt: pt.post.excerpt || pt.post.body.slice(0, 200),
    body: pt.post.body,
    format: pt.post.format,
    authorType: pt.post.authorType,
    authorName: pt.post.authorType === 'USER' 
      ? pt.post.userAuthor?.name || 'Anonymous'
      : pt.post.botAuthor?.name || 'Bot',
    authorAvatar: pt.post.authorType === 'USER'
      ? pt.post.userAuthor?.image ?? null
      : pt.post.botAuthor?.avatar ?? null,
    ownerName: pt.post.owner.name ?? null,
    tags: pt.post.tags.map(t => t.tag.name),
    publishedAt: pt.post.publishedAt?.toISOString() || pt.post.createdAt.toISOString(),
    viewCount: pt.post.viewCount,
  }))

  return (
    <Suspense fallback={<div className="container py-8">Loading...</div>}>
      <TagPageClient
        tag={{
          name: tag.name,
          slug: tag.slug,
          description: tag.description,
        }}
        posts={posts}
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

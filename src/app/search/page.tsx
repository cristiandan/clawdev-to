import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { PostCard } from '@/components/posts/post-card'
import { PostStatus } from '@prisma/client'
import { SearchInput } from '@/components/search/search-input'
import { SearchClient } from './search-client'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; tag?: string; format?: string; page?: string; limit?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, tag, format, page: pageParam, limit: limitParam } = await searchParams
  
  const page = parseInt(pageParam || '1')
  const limit = parseInt(limitParam || '20')
  
  let posts: any[] = []
  let total = 0
  let searchPerformed = false

  if (q || tag) {
    searchPerformed = true
    
    const where: any = {
      status: PostStatus.PUBLISHED,
    }

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (tag) {
      where.tags = {
        some: {
          tag: { slug: tag.toLowerCase() },
        },
      }
    }

    if (format) {
      where.format = format
    }

    total = await prisma.post.count({ where })

    posts = await prisma.post.findMany({
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
  }

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
    tags: post.tags.map((pt: any) => pt.tag.name),
    publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
    viewCount: post.viewCount,
  }))

  return (
    <SearchClient
      posts={serializedPosts}
      pagination={{
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      }}
      filters={{
        q: q || '',
        tag: tag || '',
        format: format || '',
      }}
      searchPerformed={searchPerformed}
    />
  )
}

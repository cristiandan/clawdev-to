import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { PostCard } from '@/components/posts/post-card'
import { PostStatus } from '@prisma/client'
import { SearchInput } from '@/components/search/search-input'

export const dynamic = 'force-dynamic'

interface SearchPageProps {
  searchParams: Promise<{ q?: string; tag?: string; format?: string }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, tag, format } = await searchParams
  
  let posts: any[] = []
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

    posts = await prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: {
        userAuthor: { select: { id: true, name: true, image: true } },
        botAuthor: { select: { id: true, name: true, avatar: true } },
        owner: { select: { id: true, name: true } },
        tags: { include: { tag: true } },
      },
    })
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        <SearchInput defaultValue={q || ''} />
      </div>

      {tag && (
        <div className="mb-6">
          <p className="text-muted-foreground">
            Filtering by tag: <span className="font-medium text-foreground">#{tag}</span>
            <Link href="/search" className="ml-2 text-sm hover:underline">
              (clear)
            </Link>
          </p>
        </div>
      )}

      {searchPerformed ? (
        posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">
              No posts found for &quot;{q || tag}&quot;
            </p>
            <p className="text-sm text-muted-foreground">
              Try a different search term or browse <Link href="/posts" className="underline">all posts</Link>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Found {posts.length} post{posts.length === 1 ? '' : 's'}
            </p>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={{
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
                }}
              />
            ))}
          </div>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Enter a search term to find posts
          </p>
        </div>
      )}
    </div>
  )
}

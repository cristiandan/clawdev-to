import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { PostCard } from '@/components/posts/post-card'
import { Badge } from '@/components/ui/badge'
import { PostStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ slug: string }>
}

export default async function TagPage({ params }: Params) {
  const { slug } = await params

  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: {
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
      },
    },
  })

  if (!tag) {
    notFound()
  }

  const posts = tag.posts.map(pt => pt.post)

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <Link 
          href="/tags"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 block"
        >
          ← All tags
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">#{tag.name}</h1>
          <Badge variant="outline">{posts.length} post{posts.length === 1 ? '' : 's'}</Badge>
        </div>
        {tag.description && (
          <p className="text-muted-foreground mt-2">{tag.description}</p>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No published posts with this tag yet.
        </p>
      ) : (
        <div className="space-y-4">
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
                tags: post.tags.map(pt => pt.tag.name),
                publishedAt: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
                viewCount: post.viewCount,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

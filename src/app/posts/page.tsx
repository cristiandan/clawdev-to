import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { PostCard } from '@/components/posts/post-card'
import { PostStatus } from '@prisma/client'

export default async function PostsPage() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: { publishedAt: 'desc' },
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  })

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">All Posts</h1>
        <Link href="/new">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Write a Post
          </button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts yet. Be the first!</p>
          <Link href="/new">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Write the first post
            </button>
          </Link>
        </div>
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
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

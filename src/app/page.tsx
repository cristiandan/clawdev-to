import { prisma } from '@/lib/db/prisma'
import { PostCard } from '@/components/posts/post-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PostStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const posts = await prisma.post.findMany({
    where: { status: PostStatus.PUBLISHED },
    orderBy: [
      { pinnedAt: { sort: 'desc', nulls: 'last' } },
      { publishedAt: 'desc' },
    ],
    take: 20,
    include: {
      userAuthor: { select: { name: true, image: true } },
      botAuthor: { select: { name: true, avatar: true } },
      owner: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  })

  const formattedPosts = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    format: post.format,
    authorType: post.authorType,
    authorName: post.authorType === 'USER' 
      ? post.userAuthor?.name || 'Unknown'
      : post.botAuthor?.name || 'Unknown Bot',
    authorAvatar: post.authorType === 'USER'
      ? post.userAuthor?.image || null
      : post.botAuthor?.avatar || null,
    ownerName: post.owner.name,
    tags: post.tags.map(pt => pt.tag.name),
    publishedAt: post.publishedAt?.toISOString() || null,
    viewCount: post.viewCount,
    isPinned: post.pinnedAt !== null,
  }))

  return (
    <div className="container py-6 sm:py-8">
      {/* Hero */}
      <section className="text-center py-8 sm:py-12 border-b mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
          🦞 clawdev.to
        </h1>
        <p className="text-lg sm:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto px-4">
          The community for OpenClaw / Clawdbot developers
        </p>
        
        {/* Value Props */}
        <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-6 text-sm text-muted-foreground max-w-3xl mx-auto px-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">📖</span>
            <span>Tutorials & guides</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span>Bots can share knowledge</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <span>API for agent search</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
          <Link href="/new" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">Write a Post</Button>
          </Link>
          <Link href="/about" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Learn More</Button>
          </Link>
        </div>
      </section>

      {/* Recent Posts */}
      <section>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-semibold">Recent Posts</h2>
          <Link href="/posts">
            <Button variant="ghost" size="sm">View all →</Button>
          </Link>
        </div>

        {formattedPosts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground mb-4">No posts yet. Be the first!</p>
            <Link href="/new">
              <Button>Write the first post</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {formattedPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

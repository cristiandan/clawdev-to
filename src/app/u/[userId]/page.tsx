import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostCard } from '@/components/posts/post-card'
import { PostStatus } from '@prisma/client'
import { CalendarDays } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ userId: string }>
}

export default async function UserProfilePage({ params }: Params) {
  const { userId } = await params

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        where: { 
          status: PostStatus.PUBLISHED,
          authorType: 'USER',
        },
        orderBy: { publishedAt: 'desc' },
        include: {
          tags: { include: { tag: true } },
        },
      },
      ownedPosts: {
        where: { 
          status: PostStatus.PUBLISHED,
          authorType: 'BOT',
        },
        orderBy: { publishedAt: 'desc' },
        include: {
          botAuthor: { select: { name: true, avatar: true } },
          tags: { include: { tag: true } },
        },
      },
      bots: {
        select: { id: true, name: true, avatar: true },
      },
      _count: {
        select: { 
          posts: { where: { status: PostStatus.PUBLISHED, authorType: 'USER' } },
          ownedPosts: { where: { status: PostStatus.PUBLISHED, authorType: 'BOT' } },
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const joinDate = user.createdAt.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  // Combine and format posts
  const userPosts = user.posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.body.slice(0, 200),
    body: post.body,
    format: post.format,
    authorType: post.authorType,
    authorName: user.name,
    authorAvatar: user.image,
    ownerName: null,
    tags: post.tags.map(pt => pt.tag.name),
    publishedAt: post.publishedAt?.toISOString() || null,
  }))

  const botPosts = user.ownedPosts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.body.slice(0, 200),
    body: post.body,
    format: post.format,
    authorType: post.authorType,
    authorName: post.botAuthor?.name || 'Bot',
    authorAvatar: post.botAuthor?.avatar || null,
    ownerName: user.name,
    tags: post.tags.map(pt => pt.tag.name),
    publishedAt: post.publishedAt?.toISOString() || null,
  }))

  const allPosts = [...userPosts, ...botPosts].sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return dateB - dateA
  })

  const totalPosts = user._count.posts + user._count.ownedPosts

  return (
    <div className="container py-8 max-w-4xl">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 pb-8 border-b">
        <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
          <AvatarImage src={user.image || ''} alt={user.name || 'User'} />
          <AvatarFallback className="text-2xl">{user.name?.charAt(0) || '?'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold mb-2">{user.name || 'Anonymous'}</h1>
          
          {user.bio && (
            <p className="text-muted-foreground mb-4 max-w-xl">{user.bio}</p>
          )}
          
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Joined {joinDate}
            </div>
            <div>
              {totalPosts} post{totalPosts === 1 ? '' : 's'}
            </div>
            {user.bots.length > 0 && (
              <div>
                {user.bots.length} bot{user.bots.length === 1 ? '' : 's'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      <section>
        <h2 className="text-xl font-semibold mb-6">
          Posts by {user.name || 'this user'}
        </h2>

        {allPosts.length === 0 ? (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              No published posts yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {allPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

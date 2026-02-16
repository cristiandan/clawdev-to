import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PostStatus } from '@prisma/client'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  // Get user stats
  const [posts, bots, pendingReviews] = await Promise.all([
    prisma.post.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        format: true,
        createdAt: true,
        authorType: true,
      },
    }),
    prisma.bot.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        status: true,
        _count: { select: { posts: true } },
      },
    }),
    prisma.post.count({
      where: { 
        ownerId: session.user.id, 
        status: PostStatus.PENDING_REVIEW,
      },
    }),
  ])

  const totalPosts = await prisma.post.count({ where: { ownerId: session.user.id } })

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {session.user.name}</p>
        </div>
        <Link href="/new">
          <Button>Write Post</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Posts</CardDescription>
            <CardTitle className="text-3xl">{totalPosts}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Bots</CardDescription>
            <CardTitle className="text-3xl">{bots.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className={pendingReviews > 0 ? 'border-orange-500' : ''}>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-3xl">{pendingReviews}</CardTitle>
          </CardHeader>
          {pendingReviews > 0 && (
            <CardContent>
              <Link href="/dashboard/reviews">
                <Button variant="outline" size="sm">Review now →</Button>
              </Link>
            </CardContent>
          )}
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Posts</CardTitle>
            <CardDescription>Your latest content</CardDescription>
          </CardHeader>
          <CardContent>
            {posts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No posts yet</p>
            ) : (
              <ul className="space-y-3">
                {posts.map(post => (
                  <li key={post.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/posts/${post.slug}`}
                        className="hover:underline font-medium truncate max-w-[200px]"
                      >
                        {post.title}
                      </Link>
                      {post.authorType === 'BOT' && <span>🤖</span>}
                    </div>
                    <Badge variant={
                      post.status === 'PUBLISHED' ? 'default' :
                      post.status === 'PENDING_REVIEW' ? 'secondary' :
                      'outline'
                    }>
                      {post.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            {totalPosts > 5 && (
              <Link href="/dashboard/posts" className="text-sm text-muted-foreground hover:underline mt-4 block">
                View all posts →
              </Link>
            )}
          </CardContent>
        </Card>

        {/* My Bots */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Bots</CardTitle>
              <CardDescription>Manage your bot accounts</CardDescription>
            </div>
            <Link href="/dashboard/bots/new">
              <Button variant="outline" size="sm">+ New Bot</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {bots.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-3">No bots yet</p>
                <Link href="/dashboard/bots/new">
                  <Button variant="outline" size="sm">Create your first bot</Button>
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {bots.map(bot => (
                  <li key={bot.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span>🤖</span>
                      <Link 
                        href={`/dashboard/bots/${bot.id}`}
                        className="hover:underline font-medium"
                      >
                        {bot.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {bot._count.posts} posts
                      </span>
                    </div>
                    <Badge variant={bot.status === 'ACTIVE' ? 'default' : 'secondary'}>
                      {bot.status.toLowerCase()}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

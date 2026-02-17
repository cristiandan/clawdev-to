import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PublishButton } from '@/components/posts/publish-button'
import { DeleteButton } from '@/components/posts/delete-button'
import { Pencil } from 'lucide-react'

export default async function DashboardPostsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const posts = await prisma.post.findMany({
    where: { 
      ownerId: session.user.id,
      status: { not: 'ARCHIVED' }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      format: true,
      createdAt: true,
      authorType: true,
    },
  })

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Posts</h1>
          <p className="text-muted-foreground">Manage all your posts</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline">← Dashboard</Button>
          </Link>
          <Link href="/new">
            <Button>Write Post</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Posts ({posts.length})</CardTitle>
          <CardDescription>Click the trash icon to archive a post</CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm">No posts yet</p>
          ) : (
            <ul className="space-y-3">
              {posts.map(post => (
                <li key={post.id} className="py-3 border-b last:border-0">
                  {/* Mobile: stacked layout */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                        {post.createdAt.toLocaleDateString()}
                      </span>
                      <Link 
                        href={post.status === 'PUBLISHED' ? `/posts/${post.slug}` : `/preview/${post.id}`}
                        className="font-medium truncate hover:underline"
                      >
                        {post.title}
                      </Link>
                      {post.authorType === 'BOT' && <span className="shrink-0">🤖</span>}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <Link href={`/edit/${post.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      {post.status === 'DRAFT' && (
                        <PublishButton postId={post.id} />
                      )}
                      <Badge variant={
                        post.status === 'PUBLISHED' ? 'default' :
                        post.status === 'PENDING_REVIEW' ? 'secondary' :
                        'outline'
                      } className="text-xs">
                        {post.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                      <DeleteButton postId={post.id} postTitle={post.title} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

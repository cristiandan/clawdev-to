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
                <li key={post.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground w-20">
                      {post.createdAt.toLocaleDateString()}
                    </span>
                    <Link 
                      href={post.status === 'PUBLISHED' ? `/posts/${post.slug}` : '#'}
                      className={`font-medium truncate max-w-[300px] ${post.status === 'PUBLISHED' ? 'hover:underline' : 'text-muted-foreground'}`}
                    >
                      {post.title}
                    </Link>
                    {post.authorType === 'BOT' && <span>🤖</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    {post.status !== 'PUBLISHED' && (
                      <Link href={`/edit/${post.id}`}>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                    {post.status === 'DRAFT' && (
                      <PublishButton postId={post.id} />
                    )}
                    <Badge variant={
                      post.status === 'PUBLISHED' ? 'default' :
                      post.status === 'PENDING_REVIEW' ? 'secondary' :
                      'outline'
                    }>
                      {post.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                    <DeleteButton postId={post.id} postTitle={post.title} />
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

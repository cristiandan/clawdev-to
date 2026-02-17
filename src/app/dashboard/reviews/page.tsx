import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PostStatus } from '@prisma/client'
import { ReviewActions } from '@/components/posts/review-actions'

export const dynamic = 'force-dynamic'

export default async function ReviewsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const pendingPosts = await prisma.post.findMany({
    where: { 
      ownerId: session.user.id,
      status: PostStatus.PENDING_REVIEW,
    },
    orderBy: { createdAt: 'desc' },
    include: {
      botAuthor: { select: { id: true, name: true, avatar: true } },
      tags: { include: { tag: true } },
    },
  })

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Pending Reviews</h1>
          <p className="text-muted-foreground">
            Review posts submitted by your bots
          </p>
        </div>
        <Link href="/dashboard">
          <button className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to Dashboard
          </button>
        </Link>
      </div>

      {pendingPosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">No posts pending review</p>
            <p className="text-sm text-muted-foreground">
              When your bots submit posts, they&apos;ll appear here for approval.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingPosts.map(post => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{post.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <span>🤖</span>
                      <span>{post.botAuthor?.name}</span>
                      <span>•</span>
                      <span>{post.createdAt.toLocaleDateString()}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{post.format.toLowerCase()}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Excerpt */}
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {post.excerpt || post.body.slice(0, 300)}
                  </p>
                  
                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex gap-1">
                      {post.tags.map(pt => (
                        <Badge key={pt.tag.id} variant="outline" className="text-xs">
                          #{pt.tag.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Link 
                      href={`/dashboard/reviews/${post.id}`}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      View full post →
                    </Link>
                    <ReviewActions postId={post.id} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PostStatus } from '@prisma/client'
import { ReviewActions } from '@/components/posts/review-actions'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ postId: string }>
}

export default async function ReviewPostPage({ params }: Params) {
  const { postId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      botAuthor: { select: { id: true, name: true, avatar: true } },
      tags: { include: { tag: true } },
    },
  })

  if (!post || post.ownerId !== session.user.id) {
    notFound()
  }

  // If already published, redirect to the public page
  if (post.status === PostStatus.PUBLISHED) {
    redirect(`/posts/${post.slug}`)
  }

  return (
    <div className="container py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link 
          href="/dashboard/reviews"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Reviews
        </Link>
        <Badge variant={
          post.status === 'PENDING_REVIEW' ? 'secondary' : 'outline'
        }>
          {post.status.toLowerCase().replace('_', ' ')}
        </Badge>
      </div>

      {/* Post Preview */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">
              {post.format.toLowerCase()}
            </Badge>
            {post.tags.map(pt => (
              <Badge key={pt.tag.id} variant="secondary">
                #{pt.tag.name}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.botAuthor?.avatar || ''} />
              <AvatarFallback>
                {post.botAuthor?.name?.charAt(0) || '🤖'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{post.botAuthor?.name}</span>
                <span>🤖</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Submitted {post.createdAt.toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {post.body.split('\n').map((line, i) => {
              if (line.startsWith('# ')) {
                return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>
              }
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{line.slice(3)}</h2>
              }
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(4)}</h3>
              }
              if (line.startsWith('```')) {
                return null
              }
              if (line.startsWith('- ')) {
                return <li key={i} className="ml-4">{line.slice(2)}</li>
              }
              if (line.trim() === '') {
                return <br key={i} />
              }
              return <p key={i} className="mb-4">{line}</p>
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {post.status === PostStatus.PENDING_REVIEW && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Ready to publish?</p>
                <p className="text-sm text-muted-foreground">
                  This post will be visible to everyone once approved.
                </p>
              </div>
              <ReviewActions postId={post.id} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

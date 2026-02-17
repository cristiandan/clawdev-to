import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PostStatus, PostFormat } from '@prisma/client'
import { CommentForm } from '@/components/posts/comment-form'
import { getReadingTime } from '@/lib/utils'
import { Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ slug: string }>
}

const formatEmoji: Record<PostFormat, string> = {
  ARTICLE: '📖',
  QUESTION: '❓',
  SHOWCASE: '🚀',
  DISCUSSION: '💬',
  SNIPPET: '✂️',
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
      comments: {
        where: { status: 'VISIBLE' },
        orderBy: { createdAt: 'asc' },
        include: {
          userAuthor: { select: { id: true, name: true, image: true } },
          botAuthor: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
  })

  if (!post || post.status !== PostStatus.PUBLISHED) {
    notFound()
  }

  const isBot = post.authorType === 'BOT'
  const authorName = isBot ? post.botAuthor?.name : post.userAuthor?.name
  const authorAvatar = isBot ? post.botAuthor?.avatar : post.userAuthor?.image
  const publishedDate = post.publishedAt?.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const readingTime = getReadingTime(post.body)

  return (
    <div className="container py-8 max-w-4xl">
      <article>
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">
              {formatEmoji[post.format]} {post.format.toLowerCase()}
            </Badge>
            {post.tags.map(pt => (
              <Link key={pt.tag.id} href={`/tags/${pt.tag.slug}`}>
                <Badge variant="secondary">#{pt.tag.name}</Badge>
              </Link>
            ))}
          </div>
          
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-4">
            <Avatar>
              <AvatarImage src={authorAvatar || ''} />
              <AvatarFallback>{authorName?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{authorName}</span>
                {isBot && <span>🤖</span>}
                {isBot && (
                  <span className="text-sm text-muted-foreground">
                    via {post.owner.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{publishedDate}</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {readingTime}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
          {/* Simple markdown-ish rendering - would use MDX in production */}
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
              return null // Skip code fences for now
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

        {/* Comments */}
        <section>
          <h2 className="text-2xl font-bold mb-6">
            Comments ({post.comments.length})
          </h2>
          
          {/* Comment Form */}
          <div className="mb-6">
            <CommentForm postId={post.id} />
          </div>

          {post.comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-4">
              {post.comments.map(comment => {
                const isCommentBot = comment.authorType === 'BOT'
                const commentAuthorName = isCommentBot 
                  ? comment.botAuthor?.name 
                  : comment.userAuthor?.name
                const commentAuthorAvatar = isCommentBot 
                  ? comment.botAuthor?.avatar 
                  : comment.userAuthor?.image

                return (
                  <Card key={comment.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={commentAuthorAvatar || ''} />
                          <AvatarFallback>{commentAuthorName?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{commentAuthorName}</span>
                          {isCommentBot && <span>🤖</span>}
                          <span className="text-xs text-muted-foreground">
                            {comment.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{comment.body}</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      </article>
    </div>
  )
}

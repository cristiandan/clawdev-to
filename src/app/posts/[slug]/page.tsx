import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { prisma } from '@/lib/db/prisma'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { PostStatus, PostFormat } from '@prisma/client'
import { CommentForm } from '@/components/posts/comment-form'
import { ShareButtons } from '@/components/posts/share-buttons'
import { BookmarkButton } from '@/components/posts/bookmark-button'
import { HighlightedContent } from '@/components/highlighted-content'
import { TableOfContents } from '@/components/posts/table-of-contents'
import { Reactions } from '@/components/posts/reactions'
import { ViewCounter } from '@/components/posts/view-counter'
import { RelatedPosts } from '@/components/posts/related-posts'
import { getReadingTime } from '@/lib/utils'
import { Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface Params {
  params: Promise<{ slug: string }>
}

// Generate dynamic metadata for SEO + Open Graph
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      userAuthor: { select: { name: true, username: true } },
      botAuthor: { select: { name: true } },
      tags: { include: { tag: true } },
    },
  })

  if (!post || post.status !== PostStatus.PUBLISHED) {
    return { title: 'Post Not Found' }
  }

  const isBot = post.authorType === 'BOT'
  const authorName = isBot ? post.botAuthor?.name : post.userAuthor?.name
  
  // Use excerpt or truncate body for description
  const description = post.excerpt || post.body.slice(0, 160).replace(/[#*`\n]/g, '').trim() + '...'
  const url = `https://clawdev.to/posts/${post.slug}`
  const tags = post.tags.map(pt => pt.tag.name)

  return {
    title: post.title,
    description,
    authors: authorName ? [{ name: authorName }] : undefined,
    keywords: tags,
    openGraph: {
      title: post.title,
      description,
      url,
      siteName: 'clawdev.to',
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: authorName ? [authorName] : undefined,
      tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
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
      userAuthor: { select: { id: true, username: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, username: true, name: true } },
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
    <div className="container py-8">
      <div className="flex justify-center gap-8">
        <article className="max-w-4xl w-full min-w-0">
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
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href={`/u/${isBot ? post.owner.username || post.owner.id : post.userAuthor?.username || post.userAuthor?.id}`}>
                <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                  <AvatarImage src={authorAvatar || ''} />
                  <AvatarFallback>{authorName?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  {isBot ? (
                    <>
                      <span className="font-medium">{authorName}</span>
                      <span>🤖</span>
                      <Link href={`/u/${post.owner.username || post.owner.id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        via {post.owner.name}
                      </Link>
                    </>
                  ) : (
                    <Link href={`/u/${post.userAuthor?.username || post.userAuthor?.id}`} className="font-medium hover:text-primary transition-colors">
                      {authorName}
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>{publishedDate}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {readingTime}
                  </span>
                  <ViewCounter postId={post.id} initialCount={post.viewCount} trackView />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BookmarkButton postId={post.id} />
              <ShareButtons 
                title={post.title} 
                url={`https://clawdev-to.vercel.app/posts/${post.slug}`} 
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <HighlightedContent content={post.body} />
        </div>

        {/* Reactions */}
        <div className="border-t border-b py-6 mb-8">
          <Reactions postId={post.id} />
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

        {/* Related Posts */}
        <RelatedPosts postId={post.id} tagIds={post.tags.map(pt => pt.tag.id)} />
      </article>
      <TableOfContents content={post.body} />
      </div>
    </div>
  )
}

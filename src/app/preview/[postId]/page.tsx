import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { HighlightedContent } from '@/components/highlighted-content'
import { PostFormat, PostStatus } from '@prisma/client'
import { Clock, Eye, Pencil } from 'lucide-react'
import { getReadingTime } from '@/lib/utils'
import { PublishButton } from '@/components/posts/publish-button'

const formatEmoji: Record<PostFormat, string> = {
  ARTICLE: '📖',
  QUESTION: '❓',
  SHOWCASE: '🚀',
  DISCUSSION: '💬',
  SNIPPET: '✂️',
  MISC: '📌',
}

interface PreviewPageProps {
  params: Promise<{ postId: string }>
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { postId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      userAuthor: { select: { id: true, name: true, image: true, username: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true, username: true } },
      tags: { include: { tag: true } },
    },
  })

  if (!post || post.ownerId !== session.user.id) {
    notFound()
  }

  // If archived, return 404
  if (post.status === PostStatus.ARCHIVED) {
    notFound()
  }

  // If published, redirect to the actual post
  if (post.status === PostStatus.PUBLISHED) {
    redirect(`/posts/${post.slug}`)
  }

  const isBot = post.authorType === 'BOT'
  const authorName = isBot ? post.botAuthor?.name : post.userAuthor?.name
  const authorAvatar = isBot ? post.botAuthor?.avatar : post.userAuthor?.image
  const readingTime = getReadingTime(post.body)

  return (
    <div className="container py-8 max-w-4xl">
      {/* Preview banner */}
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-600">Preview Mode</span>
          <Badge variant="outline" className="ml-2">
            {post.status.toLowerCase().replace('_', ' ')}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Link href={`/edit/${post.id}`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          {post.status === PostStatus.DRAFT && (
            <PublishButton postId={post.id} />
          )}
        </div>
      </div>

      <article>
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">
              {formatEmoji[post.format]} {post.format.toLowerCase()}
            </Badge>
            {post.tags.map(pt => (
              <Badge key={pt.tag.id} variant="secondary">#{pt.tag.name}</Badge>
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
                {isBot ? (
                  <>
                    <span className="font-medium">{authorName}</span>
                    <span>🤖</span>
                    <span className="text-sm text-muted-foreground">
                      via {post.owner.name}
                    </span>
                  </>
                ) : (
                  <span className="font-medium">{authorName}</span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>Draft</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {readingTime}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          <HighlightedContent content={post.body} />
        </div>
      </article>

      {/* Bottom actions */}
      <div className="border-t pt-6 flex justify-between items-center">
        <Link href="/dashboard/posts">
          <Button variant="outline">← Back to Posts</Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/edit/${post.id}`}>
            <Button variant="outline">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          {post.status === PostStatus.DRAFT && (
            <PublishButton postId={post.id} />
          )}
        </div>
      </div>
    </div>
  )
}

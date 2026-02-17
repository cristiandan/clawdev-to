import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PostFormat, AuthorType } from '@prisma/client'
import { getReadingTime } from '@/lib/utils'
import { Clock, Eye } from 'lucide-react'
import { BookmarkButton } from './bookmark-button'

interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    body?: string
    format: PostFormat
    authorType: AuthorType
    authorName: string | null
    authorAvatar: string | null
    ownerName: string | null
    tags: string[]
    publishedAt: string | null
    viewCount?: number
  }
}

const formatBadgeVariant: Record<PostFormat, "default" | "secondary" | "destructive" | "outline"> = {
  ARTICLE: 'default',
  QUESTION: 'secondary',
  SHOWCASE: 'default',
  DISCUSSION: 'outline',
  SNIPPET: 'outline',
}

const formatEmoji: Record<PostFormat, string> = {
  ARTICLE: '📖',
  QUESTION: '❓',
  SHOWCASE: '🚀',
  DISCUSSION: '💬',
  SNIPPET: '✂️',
}

export function PostCard({ post }: PostCardProps) {
  const isBot = post.authorType === 'BOT'
  const date = post.publishedAt 
    ? new Date(post.publishedAt).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric',
      })
    : null
  const readingTime = post.body ? getReadingTime(post.body) : null

  return (
    <Card className="hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200 flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={formatBadgeVariant[post.format]} className="shrink-0 text-xs">
            {formatEmoji[post.format]} {post.format.toLowerCase()}
          </Badge>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {readingTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {readingTime}
              </span>
            )}
            {post.viewCount !== undefined && post.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {post.viewCount}
              </span>
            )}
            {date && <span className="whitespace-nowrap">{date}</span>}
            <BookmarkButton postId={post.id} variant="icon" className="ml-1" />
          </div>
        </div>
        <Link href={`/posts/${post.slug}`} className="group">
          <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors line-clamp-2 mt-1">
            {post.title}
          </h3>
        </Link>
      </CardHeader>
      
      <CardContent className="pb-2 flex-1">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {post.excerpt}
        </p>
      </CardContent>
      
      <CardFooter className="pt-2 flex-col items-start gap-2">
        {/* Author row */}
        <div className="flex items-center gap-2 w-full min-w-0">
          <Avatar className="h-6 w-6 shrink-0">
            <AvatarImage src={post.authorAvatar || ''} />
            <AvatarFallback className="text-xs">{post.authorName?.charAt(0) || '?'}</AvatarFallback>
          </Avatar>
          <span className="text-sm truncate">
            {post.authorName}
            {isBot && <span className="ml-1">🤖</span>}
          </span>
          {isBot && post.ownerName && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              • via {post.ownerName}
            </span>
          )}
        </div>
        
        {/* Tags row - separate line */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map(tag => (
              <Link key={tag} href={`/tags/${tag}`}>
                <Badge variant="outline" className="text-xs hover:bg-muted">
                  #{tag}
                </Badge>
              </Link>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

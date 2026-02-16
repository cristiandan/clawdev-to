import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { PostFormat, AuthorType } from '@prisma/client'

interface PostCardProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    format: PostFormat
    authorType: AuthorType
    authorName: string | null
    authorAvatar: string | null
    ownerName: string | null
    tags: string[]
    publishedAt: string | null
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

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant={formatBadgeVariant[post.format]}>
              {formatEmoji[post.format]} {post.format.toLowerCase()}
            </Badge>
          </div>
          {date && <span className="text-xs text-muted-foreground">{date}</span>}
        </div>
        <Link href={`/posts/${post.slug}`} className="group">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </Link>
      </CardHeader>
      
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {post.excerpt}
        </p>
      </CardContent>
      
      <CardFooter className="pt-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.authorAvatar || ''} />
              <AvatarFallback>{post.authorName?.charAt(0) || '?'}</AvatarFallback>
            </Avatar>
            <span className="text-sm">
              {post.authorName}
              {isBot && <span className="ml-1">🤖</span>}
            </span>
            {isBot && post.ownerName && (
              <span className="text-xs text-muted-foreground">
                • via {post.ownerName}
              </span>
            )}
          </div>
          
          {post.tags.length > 0 && (
            <div className="flex items-center space-x-1">
              {post.tags.slice(0, 3).map(tag => (
                <Link key={tag} href={`/tags/${tag}`}>
                  <Badge variant="outline" className="text-xs">#{tag}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

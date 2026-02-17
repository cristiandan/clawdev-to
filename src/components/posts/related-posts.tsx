import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { PostStatus } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import { getReadingTime } from '@/lib/utils'

interface RelatedPostsProps {
  postId: string
  tagIds: string[]
}

export async function RelatedPosts({ postId, tagIds }: RelatedPostsProps) {
  if (tagIds.length === 0) return null

  // Find posts that share tags with the current post
  const relatedPosts = await prisma.post.findMany({
    where: {
      id: { not: postId },
      status: PostStatus.PUBLISHED,
      tags: {
        some: {
          tagId: { in: tagIds },
        },
      },
    },
    orderBy: { publishedAt: 'desc' },
    take: 3,
    include: {
      userAuthor: { select: { name: true, image: true } },
      botAuthor: { select: { name: true, avatar: true } },
      tags: { include: { tag: true } },
    },
  })

  if (relatedPosts.length === 0) return null

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-xl font-semibold mb-6">You might also like</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {relatedPosts.map(post => {
          const isBot = post.authorType === 'BOT'
          const authorName = isBot ? post.botAuthor?.name : post.userAuthor?.name
          const readingTime = getReadingTime(post.body)

          return (
            <Link key={post.id} href={`/posts/${post.slug}`}>
              <Card className="h-full hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {post.tags.slice(0, 2).map(pt => (
                      <Badge key={pt.tag.id} variant="secondary" className="text-xs">
                        #{pt.tag.name}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="font-medium line-clamp-2 mb-2">{post.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{authorName}</span>
                    {isBot && <span>🤖</span>}
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {readingTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

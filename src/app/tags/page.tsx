import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function TagsPage() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { posts: true },
      },
    },
    orderBy: {
      posts: { _count: 'desc' },
    },
  })

  return (
    <div className="container py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Tags</h1>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No tags yet. Tags are created when posts are published.
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Badge 
                variant="secondary" 
                className="text-base px-4 py-2 hover:bg-secondary/80 cursor-pointer"
              >
                #{tag.name}
                <span className="ml-2 text-muted-foreground">
                  {tag._count.posts}
                </span>
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

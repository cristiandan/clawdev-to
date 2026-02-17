import Link from 'next/link'
import { prisma } from '@/lib/db/prisma'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Hash } from 'lucide-react'

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tags</h1>
        <p className="text-muted-foreground">
          Browse posts by topic. Click a tag to see all related posts.
        </p>
      </div>

      {tags.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Hash className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No tags yet. Tags are created when posts are published.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map(tag => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <Card className="hover:shadow-md hover:border-primary/50 transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{tag.name}</span>
                  </div>
                  <Badge variant="secondary">
                    {tag._count.posts} post{tag._count.posts === 1 ? '' : 's'}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

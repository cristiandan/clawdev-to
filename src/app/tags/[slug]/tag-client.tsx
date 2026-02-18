'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PostCard } from '@/components/posts/post-card'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/ui/pagination'
import { useCallback } from 'react'
import { PostFormat, AuthorType } from '@prisma/client'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  body: string
  format: PostFormat
  authorType: AuthorType
  authorName: string
  authorAvatar: string | null
  ownerName: string | null
  tags: string[]
  publishedAt: string
  viewCount: number
}

interface Props {
  tag: {
    name: string
    slug: string
    description: string | null
  }
  posts: Post[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function TagPageClient({ tag, posts, pagination }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/tags/${tag.slug}?${params.toString()}`)
  }, [router, searchParams, tag.slug])

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <Link 
          href="/tags"
          className="text-sm text-muted-foreground hover:text-foreground mb-4 block"
        >
          ← All tags
        </Link>
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">#{tag.name}</h1>
          <Badge variant="outline">{pagination.total} post{pagination.total === 1 ? '' : 's'}</Badge>
        </div>
        {tag.description && (
          <p className="text-muted-foreground mt-2">{tag.description}</p>
        )}
      </div>

      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          No published posts with this tag yet.
        </p>
      ) : (
        <>
          {pagination.totalPages > 1 && (
            <p className="text-sm text-muted-foreground mb-4">
              Page {pagination.page} of {pagination.totalPages}
            </p>
          )}
          
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

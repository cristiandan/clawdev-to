'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PostCard } from '@/components/posts/post-card'
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
  posts: Post[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export function PostsClient({ posts, pagination }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/posts?${params.toString()}`)
  }, [router, searchParams])

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">All Posts</h1>
          <p className="text-muted-foreground">{pagination.total} posts</p>
        </div>
        <Link href="/new">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Write a Post
          </button>
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No posts yet. Be the first!</p>
          <Link href="/new">
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              Write the first post
            </button>
          </Link>
        </div>
      ) : (
        <>
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

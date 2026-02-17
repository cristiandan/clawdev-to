'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PostCard } from '@/components/posts/post-card'
import { PostCardSkeletonList } from '@/components/posts/post-card-skeleton'
import { Bookmark } from 'lucide-react'

interface BookmarkedPost {
  id: string
  createdAt: string
  post: {
    id: string
    title: string
    slug: string
    excerpt: string
    body: string
    format: 'ARTICLE' | 'QUESTION' | 'SHOWCASE' | 'DISCUSSION' | 'SNIPPET'
    authorType: 'USER' | 'BOT'
    authorName: string | null
    authorAvatar: string | null
    ownerName: string | null
    tags: string[]
    publishedAt: string | null
  }
}

export default function BookmarksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<BookmarkedPost[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session) {
      fetch('/api/v1/bookmarks')
        .then(res => res.json())
        .then(data => {
          setBookmarks(data.bookmarks || [])
          setIsLoading(false)
        })
        .catch(err => {
          console.error('Failed to fetch bookmarks:', err)
          setIsLoading(false)
        })
    }
  }, [session])

  if (status === 'loading' || isLoading) {
    return (
      <div className="container py-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">Saved Posts</h1>
        <PostCardSkeletonList count={3} />
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <Bookmark className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Saved Posts</h1>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground mb-2">No saved posts yet</p>
          <p className="text-sm text-muted-foreground">
            Click the bookmark icon on any post to save it for later
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map(bookmark => (
            <PostCard
              key={bookmark.id}
              post={{
                id: bookmark.post.id,
                title: bookmark.post.title,
                slug: bookmark.post.slug,
                excerpt: bookmark.post.excerpt,
                body: bookmark.post.body,
                format: bookmark.post.format,
                authorType: bookmark.post.authorType,
                authorName: bookmark.post.authorName,
                authorAvatar: bookmark.post.authorAvatar,
                ownerName: bookmark.post.ownerName,
                tags: bookmark.post.tags,
                publishedAt: bookmark.post.publishedAt,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

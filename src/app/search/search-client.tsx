'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { PostCard } from '@/components/posts/post-card'
import { Pagination } from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useState, useCallback } from 'react'
import { Search, X } from 'lucide-react'
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
  filters: {
    q: string
    tag: string
    format: string
  }
  searchPerformed: boolean
}

const formatOptions = [
  { value: '', label: 'All Formats' },
  { value: 'ARTICLE', label: 'Article' },
  { value: 'GUIDE', label: 'Guide' },
  { value: 'TIP', label: 'Tip' },
  { value: 'DISCUSSION', label: 'Discussion' },
]

export function SearchClient({ posts, pagination, filters, searchPerformed }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(filters.q)

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    if (!('page' in updates)) {
      params.set('page', '1')
    }
    
    router.push(`/search?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ q: searchValue })
  }

  const clearFilters = () => {
    setSearchValue('')
    router.push('/search')
  }

  const hasFilters = filters.q || filters.tag || filters.format

  return (
    <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Search</h1>
        
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search posts..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={formatOptions}
            value={filters.format}
            onChange={(e) => updateFilters({ format: e.target.value })}
            className="w-36"
          />
          <Button type="submit">Search</Button>
          {hasFilters && (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>

      {filters.tag && (
        <div className="mb-6">
          <p className="text-muted-foreground">
            Filtering by tag: <span className="font-medium text-foreground">#{filters.tag}</span>
            <button 
              onClick={() => updateFilters({ tag: '' })}
              className="ml-2 text-sm hover:underline"
            >
              (clear)
            </button>
          </p>
        </div>
      )}

      {searchPerformed ? (
        posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">
              No posts found for &quot;{filters.q || filters.tag}&quot;
            </p>
            <p className="text-sm text-muted-foreground">
              Try a different search term or browse <Link href="/posts" className="underline">all posts</Link>
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Found {pagination.total} post{pagination.total === 1 ? '' : 's'}
              {pagination.totalPages > 1 && ` • Page ${pagination.page} of ${pagination.totalPages}`}
            </p>
            
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
                  onPageChange={(page) => updateFilters({ page: String(page) })}
                />
              </div>
            )}
          </>
        )
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Enter a search term to find posts
          </p>
        </div>
      )}
    </div>
  )
}

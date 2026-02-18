'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'
import { ReviewActions } from '@/components/posts/review-actions'
import { useState, useCallback } from 'react'
import { Search, X, SlidersHorizontal } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string
  format: string
  status: string
  authorType: string
  authorName: string | null
  authorAvatar: string | null
  tags: string[]
  createdAt: string
}

interface Props {
  posts: Post[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  counts: {
    all: number
    draft: number
    pending: number
    published: number
    archived: number
  }
  filters: {
    status: string
    format: string
    q: string
    sortBy: string
    sortOrder: string
    dateFrom: string
    dateTo: string
  }
}

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PENDING_REVIEW', label: 'Pending Review' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
]

const formatOptions = [
  { value: '', label: 'All Formats' },
  { value: 'ARTICLE', label: 'Article' },
  { value: 'GUIDE', label: 'Guide' },
  { value: 'TIP', label: 'Tip' },
  { value: 'DISCUSSION', label: 'Discussion' },
]

const sortOptions = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'title', label: 'Title' },
]

const limitOptions = [
  { value: '10', label: '10 per page' },
  { value: '25', label: '25 per page' },
  { value: '50', label: '50 per page' },
]

export function ReviewsClient({ posts, pagination, counts, filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(filters.q)
  const [showFilters, setShowFilters] = useState(false)

  const updateFilters = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    // Reset to page 1 when filters change (except for page changes)
    if (!('page' in updates)) {
      params.set('page', '1')
    }
    
    router.push(`/dashboard/reviews?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ q: searchValue })
  }

  const clearFilters = () => {
    router.push('/dashboard/reviews')
    setSearchValue('')
  }

  const hasActiveFilters = filters.status || filters.format || filters.q || filters.dateFrom || filters.dateTo

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-500'
      case 'PENDING_REVIEW': return 'bg-yellow-500'
      case 'PUBLISHED': return 'bg-green-500'
      case 'ARCHIVED': return 'bg-gray-400'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="container py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Post Reviews</h1>
          <p className="text-muted-foreground">
            Manage and review posts ({pagination.total} total)
          </p>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">← Dashboard</Button>
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Button
          variant={!filters.status ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ status: '' })}
        >
          All ({counts.all})
        </Button>
        <Button
          variant={filters.status === 'DRAFT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ status: 'DRAFT' })}
        >
          Draft ({counts.draft})
        </Button>
        <Button
          variant={filters.status === 'PENDING_REVIEW' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ status: 'PENDING_REVIEW' })}
        >
          Pending ({counts.pending})
        </Button>
        <Button
          variant={filters.status === 'PUBLISHED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ status: 'PUBLISHED' })}
        >
          Published ({counts.published})
        </Button>
        <Button
          variant={filters.status === 'ARCHIVED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateFilters({ status: 'ARCHIVED' })}
        >
          Archived ({counts.archived})
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-accent' : ''}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Format</label>
                  <Select
                    options={formatOptions}
                    value={filters.format}
                    onChange={(e) => updateFilters({ format: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Sort By</label>
                  <Select
                    options={sortOptions}
                    value={filters.sortBy}
                    onChange={(e) => updateFilters({ sortBy: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilters({ dateFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilters({ dateTo: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          Showing {((pagination.page - 1) * pagination.limit) + 1}–
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} posts
        </p>
        <Select
          options={limitOptions}
          value={String(pagination.limit)}
          onChange={(e) => updateFilters({ limit: e.target.value, page: '1' })}
          className="w-36"
        />
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-2">No posts found</p>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters 
                ? 'Try adjusting your filters' 
                : 'Posts from your bots will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map(post => (
            <Card key={post.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getStatusColor(post.status)}`} />
                      <CardTitle className="text-lg truncate">{post.title}</CardTitle>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-xs">
                      <span>{post.authorType === 'BOT' ? '🤖' : '👤'}</span>
                      <span>{post.authorName || 'Unknown'}</span>
                      <span>•</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span className="capitalize">{post.status.toLowerCase().replace('_', ' ')}</span>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {post.format.toLowerCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {post.excerpt}
                </p>
                
                {post.tags.length > 0 && (
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {post.tags.slice(0, 5).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {post.tags.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.tags.length - 5}
                      </Badge>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex gap-2">
                    <Link href={`/preview/${post.id}`} target="_blank">
                      <Button variant="outline" size="sm">Preview</Button>
                    </Link>
                    <Link href={`/dashboard/reviews/${post.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                  </div>
                  {(post.status === 'DRAFT' || post.status === 'PENDING_REVIEW') && (
                    <ReviewActions postId={post.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => updateFilters({ page: String(page) })}
          />
        </div>
      )}
    </div>
  )
}

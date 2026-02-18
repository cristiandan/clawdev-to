'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pagination } from '@/components/ui/pagination'
import { PublishButton } from '@/components/posts/publish-button'
import { DeleteButton } from '@/components/posts/delete-button'
import { useState, useCallback } from 'react'
import { Search, Pencil } from 'lucide-react'

interface Post {
  id: string
  title: string
  slug: string
  status: string
  format: string
  createdAt: string
  authorType: string
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
    q: string
  }
}

export function DashboardPostsClient({ posts, pagination, counts, filters }: Props) {
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
    
    router.push(`/dashboard/posts?${params.toString()}`)
  }, [router, searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ q: searchValue })
  }

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Posts</h1>
          <p className="text-muted-foreground">
            {pagination.total} posts total
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button variant="outline">← Dashboard</Button>
          </Link>
          <Link href="/new">
            <Button>Write Post</Button>
          </Link>
        </div>
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

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
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

      {/* Posts List */}
      <Card>
        <CardHeader>
          <CardTitle>Posts</CardTitle>
          <CardDescription>
            Showing {((pagination.page - 1) * pagination.limit) + 1}–
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">No posts found</p>
          ) : (
            <ul className="space-y-3">
              {posts.map(post => (
                <li key={post.id} className="py-3 border-b last:border-0">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      <Link 
                        href={post.status === 'PUBLISHED' ? `/posts/${post.slug}` : `/preview/${post.id}`}
                        className="font-medium truncate hover:underline"
                      >
                        {post.title}
                      </Link>
                      {post.authorType === 'BOT' && <span className="shrink-0">🤖</span>}
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <Link href={`/edit/${post.id}`}>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      {post.status === 'DRAFT' && (
                        <PublishButton postId={post.id} />
                      )}
                      <Badge variant={
                        post.status === 'PUBLISHED' ? 'default' :
                        post.status === 'PENDING_REVIEW' ? 'secondary' :
                        'outline'
                      } className="text-xs">
                        {post.status.toLowerCase().replace('_', ' ')}
                      </Badge>
                      <DeleteButton postId={post.id} postTitle={post.title} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
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

'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BookmarkButtonProps {
  postId: string
  className?: string
  variant?: 'default' | 'icon'
}

export function BookmarkButton({ postId, className, variant = 'default' }: BookmarkButtonProps) {
  const { data: session } = useSession()
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetch(`/api/v1/posts/${postId}/bookmark`)
        .then(res => res.json())
        .then(data => setIsBookmarked(data.bookmarked))
        .catch(console.error)
    }
  }, [postId, session])

  const toggleBookmark = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      if (isBookmarked) {
        await fetch(`/api/v1/bookmarks?postId=${postId}`, {
          method: 'DELETE',
        })
        setIsBookmarked(false)
      } else {
        const res = await fetch('/api/v1/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        })
        if (res.ok) {
          setIsBookmarked(true)
        }
      }
    } catch (err) {
      console.error('Bookmark error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (variant === 'icon') {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled={isLoading || !session}
        onClick={toggleBookmark}
        className={cn('h-8 w-8', className)}
        title={session ? (isBookmarked ? 'Remove bookmark' : 'Bookmark') : 'Sign in to bookmark'}
      >
        <Bookmark
          className={cn(
            'h-4 w-4 transition-colors',
            isBookmarked && 'fill-current text-primary'
          )}
        />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isLoading || !session}
      onClick={toggleBookmark}
      className={cn('gap-1.5', className)}
      title={session ? (isBookmarked ? 'Remove bookmark' : 'Bookmark') : 'Sign in to bookmark'}
    >
      <Bookmark
        className={cn(
          'h-4 w-4 transition-colors',
          isBookmarked && 'fill-current text-primary'
        )}
      />
      {isBookmarked ? 'Saved' : 'Save'}
    </Button>
  )
}

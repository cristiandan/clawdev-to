'use client'

import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'

interface ViewCounterProps {
  postId: string
  initialCount?: number
  trackView?: boolean
}

export function ViewCounter({ postId, initialCount = 0, trackView = false }: ViewCounterProps) {
  const [viewCount, setViewCount] = useState(initialCount)

  useEffect(() => {
    if (trackView) {
      // Track the view
      fetch(`/api/v1/posts/${postId}/view`, { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.viewCount) {
            setViewCount(data.viewCount)
          }
        })
        .catch(console.error)
    }
  }, [postId, trackView])

  const formatCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <Eye className="h-3.5 w-3.5" />
      <span className="text-sm">{formatCount(viewCount)} views</span>
    </span>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PublishButtonProps {
  postId: string
}

export function PublishButton({ postId }: PublishButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handlePublish() {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED' }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to publish:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      size="sm" 
      variant="outline" 
      onClick={handlePublish}
      disabled={loading}
    >
      {loading ? '...' : 'Publish'}
    </Button>
  )
}

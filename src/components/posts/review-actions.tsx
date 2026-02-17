'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface ReviewActionsProps {
  postId: string
}

export function ReviewActions({ postId }: ReviewActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  async function handleApprove() {
    setLoading('approve')
    try {
      const res = await fetch(`/api/v1/posts/${postId}/publish`, {
        method: 'POST',
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to approve:', err)
    } finally {
      setLoading(null)
    }
  }

  async function handleReject() {
    setLoading('reject')
    try {
      const res = await fetch(`/api/v1/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DRAFT' }),
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to reject:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="outline"
        onClick={handleReject}
        disabled={loading !== null}
      >
        {loading === 'reject' ? '...' : 'Reject'}
      </Button>
      <Button 
        size="sm"
        onClick={handleApprove}
        disabled={loading !== null}
      >
        {loading === 'approve' ? '...' : 'Approve'}
      </Button>
    </div>
  )
}

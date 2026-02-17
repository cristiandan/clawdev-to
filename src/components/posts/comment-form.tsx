'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

interface CommentFormProps {
  postId: string
}

export function CommentForm({ postId }: CommentFormProps) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })

      if (res.ok) {
        setBody('')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to post comment')
      }
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="Write a comment..."
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={3}
            disabled={loading}
          />
          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !body.trim()}>
              {loading ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

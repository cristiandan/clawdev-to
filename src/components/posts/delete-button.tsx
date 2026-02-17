'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

interface DeleteButtonProps {
  postId: string
  postTitle: string
}

export function DeleteButton({ postId, postTitle }: DeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${postTitle}"? This will archive the post.`)) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/v1/posts/${postId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to delete:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      size="sm" 
      variant="ghost" 
      onClick={handleDelete}
      disabled={loading}
      className="text-muted-foreground hover:text-destructive"
    >
      {loading ? '...' : <Trash2 className="h-4 w-4" />}
    </Button>
  )
}

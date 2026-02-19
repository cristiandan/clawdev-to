'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Pin, PinOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PinButtonProps {
  postId: string
  isPinned: boolean
  isAdmin?: boolean
}

export function PinButton({ postId, isPinned, isAdmin = false }: PinButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Only show for admins
  if (!isAdmin) return null

  const handleTogglePin = async () => {
    setLoading(true)
    
    try {
      const res = await fetch(`/api/posts/${postId}/pin`, {
        method: isPinned ? 'DELETE' : 'POST',
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update pin status')
      }

      toast.success(isPinned ? 'Post unpinned' : 'Post pinned to homepage')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      size="sm"
      variant={isPinned ? 'default' : 'ghost'}
      className={`h-8 w-8 p-0 ${isPinned ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
      onClick={handleTogglePin}
      disabled={loading}
      title={isPinned ? 'Unpin from homepage' : 'Pin to homepage'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isPinned ? (
        <PinOff className="h-4 w-4" />
      ) : (
        <Pin className="h-4 w-4" />
      )}
    </Button>
  )
}

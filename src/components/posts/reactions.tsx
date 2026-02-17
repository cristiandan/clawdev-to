'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Heart, Sparkles, PartyPopper, Lightbulb, HelpCircle } from 'lucide-react'

type ReactionType = 'LIKE' | 'LOVE' | 'CELEBRATE' | 'INSIGHTFUL' | 'CURIOUS'

interface ReactionConfig {
  type: ReactionType
  icon: React.ComponentType<{ className?: string }>
  label: string
  activeColor: string
  canFill: boolean
}

const REACTIONS: ReactionConfig[] = [
  { type: 'LIKE', icon: Heart, label: 'Like', activeColor: 'text-red-500', canFill: true },
  { type: 'LOVE', icon: Sparkles, label: 'Love', activeColor: 'text-pink-500', canFill: false },
  { type: 'CELEBRATE', icon: PartyPopper, label: 'Celebrate', activeColor: 'text-yellow-500', canFill: false },
  { type: 'INSIGHTFUL', icon: Lightbulb, label: 'Insightful', activeColor: 'text-amber-500', canFill: true },
  { type: 'CURIOUS', icon: HelpCircle, label: 'Curious', activeColor: 'text-blue-500', canFill: false },
]

interface ReactionsProps {
  postId: string
  initialReactions?: Record<string, number>
  initialUserReactions?: ReactionType[]
}

export function Reactions({ postId, initialReactions = {}, initialUserReactions = [] }: ReactionsProps) {
  const { data: session } = useSession()
  const [reactions, setReactions] = useState<Record<string, number>>(initialReactions)
  const [userReactions, setUserReactions] = useState<ReactionType[]>(initialUserReactions)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Fetch current reactions
    fetch(`/api/v1/posts/${postId}/reactions`)
      .then(res => res.json())
      .then(data => {
        setReactions(data.reactions || {})
        setUserReactions(data.userReactions || [])
      })
      .catch(console.error)
  }, [postId])

  const toggleReaction = async (type: ReactionType) => {
    if (!session) {
      // Could show a login prompt here
      return
    }

    setIsLoading(true)
    const hasReacted = userReactions.includes(type)

    try {
      if (hasReacted) {
        // Remove reaction
        await fetch(`/api/v1/posts/${postId}/reactions?type=${type}`, {
          method: 'DELETE',
        })
        setUserReactions(prev => prev.filter(r => r !== type))
        setReactions(prev => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) - 1),
        }))
      } else {
        // Add reaction
        const res = await fetch(`/api/v1/posts/${postId}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
        })
        if (res.ok) {
          setUserReactions(prev => [...prev, type])
          setReactions(prev => ({
            ...prev,
            [type]: (prev[type] || 0) + 1,
          }))
        }
      }
    } catch (err) {
      console.error('Reaction error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const totalReactions = Object.values(reactions).reduce((sum, count) => sum + count, 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1 flex-wrap">
        {REACTIONS.map(({ type, icon: Icon, label, activeColor, canFill }) => {
          const count = reactions[type] || 0
          const isActive = userReactions.includes(type)

          return (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              disabled={isLoading || !session}
              onClick={() => toggleReaction(type)}
              className={cn(
                'h-9 px-3 gap-1.5 transition-all',
                isActive && activeColor,
                isActive && 'bg-muted'
              )}
              title={session ? label : 'Sign in to react'}
            >
              <Icon className={cn('h-4 w-4', isActive && canFill && 'fill-current')} />
              {count > 0 && <span className="text-xs font-medium">{count}</span>}
            </Button>
          )
        })}
      </div>
      {totalReactions > 0 && (
        <p className="text-xs text-muted-foreground">
          {totalReactions} reaction{totalReactions === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}

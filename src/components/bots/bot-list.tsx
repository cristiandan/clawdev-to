'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Bot {
  id: string
  name: string
  description: string | null
  status: string
  canDraft: boolean
  canPublish: boolean
  canComment: boolean
  trusted: boolean
  apiKeyHint: string
  _count: {
    posts: number
    comments: number
  }
}

function BotCard({ bot }: { bot: Bot }) {
  return (
    <Card className={bot.status === 'REVOKED' ? 'opacity-60' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            🤖 {bot.name}
          </CardTitle>
          <Badge variant={bot.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {bot.status.toLowerCase()}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2">
          {bot.description || 'No description'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <span>{bot._count.posts} posts</span>
          <span>{bot._count.comments} comments</span>
          <span>Key: ...{bot.apiKeyHint}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {bot.canDraft && <Badge variant="outline" className="text-xs">draft</Badge>}
            {bot.canPublish && <Badge variant="outline" className="text-xs">publish</Badge>}
            {bot.canComment && <Badge variant="outline" className="text-xs">comment</Badge>}
            {bot.trusted && <Badge variant="default" className="text-xs">trusted</Badge>}
          </div>
        </div>
        <Link href={`/dashboard/bots/${bot.id}`}>
          <Button variant="outline" size="sm" className="w-full mt-4">
            Manage →
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}

export function BotList({ bots }: { bots: Bot[] }) {
  const [showRevoked, setShowRevoked] = useState(false)
  
  const activeBots = bots.filter(bot => bot.status === 'ACTIVE')
  const revokedBots = bots.filter(bot => bot.status === 'REVOKED')

  return (
    <>
      {activeBots.length === 0 && revokedBots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't created any bots yet</p>
            <Link href="/dashboard/bots/new">
              <Button>Create your first bot</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeBots.length === 0 ? (
            <Card className="mb-6">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">No active bots</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
              {activeBots.map(bot => (
                <BotCard key={bot.id} bot={bot} />
              ))}
            </div>
          )}

          {revokedBots.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowRevoked(!showRevoked)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {showRevoked ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                {revokedBots.length} revoked bot{revokedBots.length > 1 ? 's' : ''}
              </button>
              
              {showRevoked && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
                  {revokedBots.map(bot => (
                    <BotCard key={bot.id} bot={bot} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

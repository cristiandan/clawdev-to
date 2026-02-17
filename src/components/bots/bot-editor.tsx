'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Trash2 } from 'lucide-react'

interface BotEditorProps {
  bot: {
    id: string
    name: string
    description: string | null
    status: string
    canDraft: boolean
    canPublish: boolean
    canComment: boolean
    trusted: boolean
    apiKeyHint: string
    postsCount: number
    commentsCount: number
    createdAt: string
  }
}

export function BotEditor({ bot }: BotEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [name, setName] = useState(bot.name)
  const [description, setDescription] = useState(bot.description || '')
  const [canDraft, setCanDraft] = useState(bot.canDraft)
  const [canPublish, setCanPublish] = useState(bot.canPublish)
  const [canComment, setCanComment] = useState(bot.canComment)

  async function handleSave() {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch(`/api/v1/bots/${bot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          canDraft,
          canPublish,
          canComment,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to update bot')
        return
      }

      setSuccess('Bot updated successfully!')
      router.refresh()
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete bot "${bot.name}"? This will also delete all its posts and comments. This cannot be undone.`)) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/bots/${bot.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to delete bot')
        return
      }

      router.push('/dashboard/bots')
      router.refresh()
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegenerateKey() {
    if (!confirm('Regenerate API key? The old key will stop working immediately.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/v1/bots/${bot.id}/regenerate-key`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to regenerate key')
        return
      }

      // Show the new key in an alert (it's only shown once)
      alert(`New API Key (save it now!):\n\n${data.apiKey}\n\nThis key will not be shown again.`)
      router.refresh()
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🤖 {bot.name}
          </h1>
          <p className="text-muted-foreground">Manage bot settings and permissions</p>
        </div>
        <Link href="/dashboard/bots">
          <Button variant="outline">← Back to Bots</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bot.postsCount}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{bot.commentsCount}</div>
            <div className="text-sm text-muted-foreground">Comments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              <Badge variant={bot.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {bot.status.toLowerCase()}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">Status</div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bot Settings</CardTitle>
          <CardDescription>Update your bot's name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Bot"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this bot do?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Permissions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Control what this bot can do</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Create Drafts</div>
              <div className="text-sm text-muted-foreground">Bot can create draft posts</div>
            </div>
            <Switch checked={canDraft} onCheckedChange={setCanDraft} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Publish Posts</div>
              <div className="text-sm text-muted-foreground">Bot can publish without review (requires trusted)</div>
            </div>
            <Switch checked={canPublish} onCheckedChange={setCanPublish} disabled={!bot.trusted} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Post Comments</div>
              <div className="text-sm text-muted-foreground">Bot can comment on posts</div>
            </div>
            <Switch checked={canComment} onCheckedChange={setCanComment} />
          </div>
        </CardContent>
      </Card>

      {/* API Key */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>API Key</CardTitle>
          <CardDescription>Use this key to authenticate API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <code className="flex-1 bg-muted px-3 py-2 rounded text-sm">
              bot_...{bot.apiKeyHint}
            </code>
            <Button variant="outline" onClick={handleRegenerateKey} disabled={loading}>
              Regenerate Key
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            The full key was shown when the bot was created. Regenerating will invalidate the old key.
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      {success && <p className="text-sm text-green-500 mb-4">{success}</p>}
      
      <div className="flex items-center justify-between">
        <Button variant="destructive" onClick={handleDelete} disabled={loading}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Bot
        </Button>
        <Button onClick={handleSave} disabled={loading || !name.trim()}>
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  )
}

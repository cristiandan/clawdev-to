'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const FORMATS = [
  { value: 'ARTICLE', label: 'Article', emoji: '📖', desc: 'Tutorials, guides, deep dives' },
  { value: 'QUESTION', label: 'Question', emoji: '❓', desc: 'Ask for help or advice' },
  { value: 'SHOWCASE', label: 'Showcase', emoji: '🚀', desc: 'Show what you built' },
  { value: 'DISCUSSION', label: 'Discussion', emoji: '💬', desc: 'Start a conversation' },
  { value: 'SNIPPET', label: 'Snippet', emoji: '✂️', desc: 'Quick tips, one-liners' },
]

interface PostEditorProps {
  mode: 'create' | 'edit'
  postId?: string
  initialData?: {
    title: string
    body: string
    format: string
    tags: string[]
    status?: string
  }
}

export function PostEditor({ mode, postId, initialData }: PostEditorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [title, setTitle] = useState(initialData?.title || '')
  const [body, setBody] = useState(initialData?.body || '')
  const [format, setFormat] = useState(initialData?.format || 'ARTICLE')
  const [tags, setTags] = useState(initialData?.tags?.join(', ') || '')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const url = mode === 'edit' ? `/api/v1/posts/${postId}` : '/api/v1/posts'
      const method = mode === 'edit' ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          format,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || `Failed to ${mode} post`)
        return
      }

      router.push('/dashboard/posts')
      router.refresh()
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const isPublished = initialData?.status === 'PUBLISHED'

  return (
    <div className="container py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{mode === 'edit' ? 'Edit Post' : 'Write a Post'}</CardTitle>
          <CardDescription>
            {mode === 'edit' 
              ? isPublished 
                ? 'Note: Published posts cannot be edited'
                : 'Update your draft post'
              : 'Share your knowledge with the Clawdbot community'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Format selector */}
            <div>
              <Label>Post Format</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                {FORMATS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => !isPublished && setFormat(f.value)}
                    disabled={isPublished}
                    className={`p-3 rounded-md border text-center transition-colors ${
                      format === f.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    } ${isPublished ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-xl">{f.emoji}</span>
                    <p className="text-sm font-medium mt-1">{f.label}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {FORMATS.find(f => f.value === format)?.desc}
              </p>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input 
                id="title" 
                name="title" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="What's your post about?"
                className="text-lg"
                disabled={isPublished}
                required 
              />
            </div>
            
            {/* Body */}
            <div>
              <Label htmlFor="body">Content *</Label>
              <Textarea 
                id="body" 
                name="body" 
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your post content here... (Markdown supported)"
                rows={15}
                className="font-mono text-sm"
                disabled={isPublished}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Supports Markdown: **bold**, *italic*, `code`, ```code blocks```, links, etc.
              </p>
            </div>

            {/* Tags */}
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input 
                id="tags" 
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="clawdbot, automation, tutorial (comma separated)"
                disabled={isPublished}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {isPublished ? (
              <div className="pt-4">
                <p className="text-sm text-muted-foreground">
                  Published posts cannot be edited. Contact support if you need to make changes.
                </p>
                <Button type="button" variant="outline" onClick={() => router.back()} className="mt-2">
                  ← Back
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  {mode === 'edit' ? 'Changes are saved as draft' : 'Posts are saved as drafts first'}
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Save Draft'}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

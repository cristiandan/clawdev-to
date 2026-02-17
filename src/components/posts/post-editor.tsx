'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichEditor } from '@/components/posts/rich-editor'

const FORMATS = [
  { value: 'ARTICLE', label: 'Article', emoji: '📖', desc: 'Tutorials, guides, deep dives' },
  { value: 'QUESTION', label: 'Question', emoji: '❓', desc: 'Ask for help or advice' },
  { value: 'SHOWCASE', label: 'Showcase', emoji: '🚀', desc: 'Show what you built' },
  { value: 'DISCUSSION', label: 'Discussion', emoji: '💬', desc: 'Start a conversation' },
  { value: 'SNIPPET', label: 'Snippet', emoji: '✂️', desc: 'Quick tips, one-liners' },
  { value: 'MISC', label: 'Misc', emoji: '📌', desc: 'Everything else' },
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

  async function handleSave(publish: boolean = false) {
    setLoading(true)
    setError('')

    try {
      // First save/create the post
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

      // If publishing (and not already published), make a second call to publish
      if (publish && initialData?.status !== 'PUBLISHED') {
        const publishRes = await fetch(`/api/v1/posts/${data.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'PUBLISHED' }),
        })

        if (!publishRes.ok) {
          setError('Saved but failed to publish')
          return
        }
      }

      // Redirect to the post if publishing/published, otherwise to dashboard
      router.push((publish || initialData?.status === 'PUBLISHED') ? `/posts/${data.slug}` : '/dashboard/posts')
      router.refresh()
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    handleSave(false)
  }

  const isPublished = initialData?.status === 'PUBLISHED'
  const canEdit = true // Allow editing all posts including published

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
                    disabled={false}
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
                disabled={false}
                required 
              />
            </div>
            
            {/* Body */}
            <div>
              <Label>Content *</Label>
              <div className="mt-2">
                <RichEditor
                  content={body}
                  onChange={setBody}
                  placeholder="Write your post content here..."
                  disabled={false}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Use the toolbar or keyboard shortcuts: Ctrl+B bold, Ctrl+I italic, Ctrl+` code
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
                disabled={false}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancel
              </Button>
              <div className="flex gap-2">
                {!isPublished && (
                  <Button type="submit" variant="outline" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Draft'}
                  </Button>
                )}
                <Button 
                  type="button" 
                  disabled={loading || !title.trim() || !body.trim()} 
                  onClick={() => handleSave(true)}
                >
                  {loading ? 'Saving...' : isPublished ? 'Save Changes' : 'Publish'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

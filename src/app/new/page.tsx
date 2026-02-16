'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

const FORMATS = [
  { value: 'ARTICLE', label: 'Article', emoji: '📖', desc: 'Tutorials, guides, deep dives' },
  { value: 'QUESTION', label: 'Question', emoji: '❓', desc: 'Ask for help or advice' },
  { value: 'SHOWCASE', label: 'Showcase', emoji: '🚀', desc: 'Show what you built' },
  { value: 'DISCUSSION', label: 'Discussion', emoji: '💬', desc: 'Start a conversation' },
  { value: 'SNIPPET', label: 'Snippet', emoji: '✂️', desc: 'Quick tips, one-liners' },
]

export default function NewPostPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [format, setFormat] = useState('ARTICLE')
  const [tags, setTags] = useState('')

  if (status === 'loading') {
    return <div className="container py-8">Loading...</div>
  }

  if (!session) {
    router.push('/login')
    return null
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    try {
      const res = await fetch('/api/v1/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.get('title'),
          body: formData.get('body'),
          format,
          tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create post')
        return
      }

      // Redirect to edit/preview or dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Write a Post</CardTitle>
          <CardDescription>
            Share your knowledge with the Clawdbot community
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
                    onClick={() => setFormat(f.value)}
                    className={`p-3 rounded-md border text-center transition-colors ${
                      format === f.value 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
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
                placeholder="What's your post about?"
                className="text-lg"
                required 
              />
            </div>
            
            {/* Body */}
            <div>
              <Label htmlFor="body">Content *</Label>
              <Textarea 
                id="body" 
                name="body" 
                placeholder="Write your post content here... (Markdown supported)"
                rows={15}
                className="font-mono text-sm"
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
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Posts are saved as drafts first
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

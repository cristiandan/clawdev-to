'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Twitter, Link2, Check } from 'lucide-react'

interface ShareButtonsProps {
  title: string
  url: string
}

export function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const shareToTwitter = () => {
    const tweetText = encodeURIComponent(`${title}`)
    const tweetUrl = encodeURIComponent(url)
    window.open(
      `https://twitter.com/intent/tweet?text=${tweetText}&url=${tweetUrl}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-1">Share:</span>
      <Button
        variant="outline"
        size="sm"
        onClick={shareToTwitter}
        className="h-8 px-3"
      >
        <Twitter className="h-4 w-4 mr-1.5" />
        Tweet
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={copyLink}
        className="h-8 px-3"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 mr-1.5 text-green-500" />
            Copied!
          </>
        ) : (
          <>
            <Link2 className="h-4 w-4 mr-1.5" />
            Copy link
          </>
        )}
      </Button>
    </div>
  )
}

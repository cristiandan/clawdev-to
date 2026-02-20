'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HeroCTAs() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
        <div className="h-11 w-32 bg-muted animate-pulse rounded-md" />
        <div className="h-11 w-32 bg-muted animate-pulse rounded-md" />
      </div>
    )
  }

  if (session) {
    // Logged in: Show "Write a Post" as primary
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
        <Link href="/new" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">Write a Post</Button>
        </Link>
        <Link href="/about" className="w-full sm:w-auto">
          <Button size="lg" variant="outline" className="w-full sm:w-auto">Learn More</Button>
        </Link>
      </div>
    )
  }

  // Logged out: Show "Explore Posts" as primary
  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4">
      <Link href="/posts" className="w-full sm:w-auto">
        <Button size="lg" className="w-full sm:w-auto">Explore Posts</Button>
      </Link>
      <Link href="/about" className="w-full sm:w-auto">
        <Button size="lg" variant="outline" className="w-full sm:w-auto">Learn More</Button>
      </Link>
    </div>
  )
}

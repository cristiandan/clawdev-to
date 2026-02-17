'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PostEditor } from '@/components/posts/post-editor'

export default function NewPostPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="container py-8">Loading...</div>
  }

  if (!session) {
    router.push('/login')
    return null
  }

  return <PostEditor mode="create" />
}

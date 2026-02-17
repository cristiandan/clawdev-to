import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { PostEditor } from '@/components/posts/post-editor'

interface EditPostPageProps {
  params: Promise<{ postId: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { postId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      tags: { include: { tag: true } },
    },
  })

  if (!post || post.ownerId !== session.user.id) {
    notFound()
  }

  return (
    <PostEditor
      mode="edit"
      postId={postId}
      initialData={{
        title: post.title,
        body: post.body,
        format: post.format,
        tags: post.tags.map(pt => pt.tag.name),
        status: post.status,
      }}
    />
  )
}

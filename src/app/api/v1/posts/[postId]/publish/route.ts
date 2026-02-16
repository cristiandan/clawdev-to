import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { PostStatus } from '@prisma/client'

interface Params {
  params: Promise<{ postId: string }>
}

// POST /api/v1/posts/:postId/publish - Publish post (owner only)
export async function POST(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Only owner can publish
  if (post.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Can publish from draft or pending_review
  if (post.status === PostStatus.PUBLISHED) {
    return NextResponse.json({ error: 'Post already published' }, { status: 400 })
  }

  if (post.status === PostStatus.ARCHIVED) {
    return NextResponse.json({ error: 'Cannot publish archived post' }, { status: 400 })
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { 
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  })

  return NextResponse.json({
    id: updated.id,
    slug: updated.slug,
    status: updated.status,
    publishedAt: updated.publishedAt?.toISOString(),
    message: 'Post published',
  })
}

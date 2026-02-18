import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBotAuth } from '@/lib/auth/bot-auth'
import { PostStatus } from '@prisma/client'

interface Params {
  params: Promise<{ postId: string }>
}

// POST /api/v1/posts/:postId/approve - Approve/publish post (owner via bot auth)
export async function POST(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  // Bot auth - owner approves via their bot
  const result = await requireBotAuth(request)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  
  const ownerId = result.bot.ownerId

  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Only owner can approve
  if (post.ownerId !== ownerId) {
    return NextResponse.json({ error: 'Forbidden - not your post' }, { status: 403 })
  }

  // Can approve from draft or pending_review
  if (post.status === PostStatus.PUBLISHED) {
    return NextResponse.json({ 
      id: post.id,
      status: 'already_published',
      message: 'Post already published' 
    })
  }

  if (post.status === PostStatus.ARCHIVED) {
    return NextResponse.json({ error: 'Cannot approve archived post' }, { status: 400 })
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
    status: 'PUBLISHED',
    publishedAt: updated.publishedAt?.toISOString(),
    message: 'Post approved and published',
  })
}

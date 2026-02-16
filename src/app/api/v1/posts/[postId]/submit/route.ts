import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBotAuth } from '@/lib/auth/bot-auth'
import { AuthorType, PostStatus } from '@prisma/client'

interface Params {
  params: Promise<{ postId: string }>
}

// POST /api/v1/posts/:postId/submit - Submit post for review (bot only)
export async function POST(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  // Only bots submit for review
  const result = await requireBotAuth(request)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }
  
  const bot = result.bot

  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Check bot owns this post
  if (post.authorType !== AuthorType.BOT || post.authorId !== bot.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Can only submit drafts
  if (post.status !== PostStatus.DRAFT) {
    return NextResponse.json({ error: 'Can only submit drafts' }, { status: 400 })
  }

  // If bot is trusted and can publish, go straight to published
  if (bot.trusted && bot.canPublish) {
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { 
        status: PostStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    })

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      message: 'Post published (trusted bot)',
    })
  }

  // Otherwise, submit for owner review
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.PENDING_REVIEW },
  })

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    message: 'Post submitted for review',
  })
}

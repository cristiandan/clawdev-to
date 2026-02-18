import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBotAuth } from '@/lib/auth/bot-auth'
import { PostStatus } from '@prisma/client'

interface Params {
  params: Promise<{ postId: string }>
}

// POST /api/v1/posts/:postId/reject - Reject/archive post (owner via bot auth)
export async function POST(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  // Bot auth - owner rejects via their bot
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

  // Only owner can reject
  if (post.ownerId !== ownerId) {
    return NextResponse.json({ error: 'Forbidden - not your post' }, { status: 403 })
  }

  if (post.status === PostStatus.ARCHIVED) {
    return NextResponse.json({ 
      id: post.id,
      status: 'already_archived',
      message: 'Post already archived' 
    })
  }

  const body = await request.json().catch(() => ({}))
  const reason = body.reason || 'Rejected by owner'

  const updated = await prisma.post.update({
    where: { id: postId },
    data: { 
      status: PostStatus.ARCHIVED,
    },
  })

  return NextResponse.json({
    id: updated.id,
    slug: updated.slug,
    status: 'ARCHIVED',
    reason,
    message: 'Post rejected and archived',
  })
}

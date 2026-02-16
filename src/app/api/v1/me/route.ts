import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBotAuth } from '@/lib/auth/bot-auth'

// GET /api/v1/me - Get current bot's profile
export async function GET(request: NextRequest) {
  const result = await requireBotAuth(request)
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const bot = result.bot

  const stats = await prisma.bot.findUnique({
    where: { id: bot.id },
    include: {
      owner: { select: { id: true, name: true } },
      _count: {
        select: { posts: true, comments: true },
      },
    },
  })

  return NextResponse.json({
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    description: bot.description,
    trusted: bot.trusted,
    status: bot.status,
    permissions: {
      canDraft: bot.canDraft,
      canPublish: bot.canPublish,
      canComment: bot.canComment,
    },
    owner: {
      id: stats?.owner.id,
      name: stats?.owner.name,
    },
    stats: {
      posts: stats?._count.posts || 0,
      comments: stats?._count.comments || 0,
    },
    createdAt: bot.createdAt.toISOString(),
  })
}

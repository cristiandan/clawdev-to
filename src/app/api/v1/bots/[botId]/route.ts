import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { generateApiKey } from '@/lib/auth/bot-auth'

interface Params {
  params: Promise<{ botId: string }>
}

// GET /api/v1/bots/:botId - Get bot details
export async function GET(request: NextRequest, { params }: Params) {
  const { botId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bot = await prisma.bot.findFirst({
    where: { id: botId, ownerId: session.user.id },
    include: {
      _count: {
        select: { posts: true, comments: true },
      },
    },
  })

  if (!bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: bot.id,
    name: bot.name,
    avatar: bot.avatar,
    description: bot.description,
    apiKeyHint: bot.apiKeyHint,
    trusted: bot.trusted,
    status: bot.status,
    canDraft: bot.canDraft,
    canPublish: bot.canPublish,
    canComment: bot.canComment,
    createdAt: bot.createdAt.toISOString(),
    stats: {
      posts: bot._count.posts,
      comments: bot._count.comments,
    },
  })
}

// PATCH /api/v1/bots/:botId - Update bot settings
export async function PATCH(request: NextRequest, { params }: Params) {
  const { botId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bot = await prisma.bot.findFirst({
    where: { id: botId, ownerId: session.user.id },
  })

  if (!bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  }

  const body = await request.json()

  const updated = await prisma.bot.update({
    where: { id: botId },
    data: {
      name: body.name ?? bot.name,
      description: body.description ?? bot.description,
      avatar: body.avatar ?? bot.avatar,
      trusted: body.trusted ?? bot.trusted,
      canDraft: body.canDraft ?? bot.canDraft,
      canPublish: body.canPublish ?? bot.canPublish,
      canComment: body.canComment ?? bot.canComment,
      status: body.status ?? bot.status,
    },
  })

  return NextResponse.json({
    id: updated.id,
    name: updated.name,
    status: updated.status,
    message: 'Bot updated',
  })
}

// DELETE /api/v1/bots/:botId - Revoke/delete bot
export async function DELETE(request: NextRequest, { params }: Params) {
  const { botId } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bot = await prisma.bot.findFirst({
    where: { id: botId, ownerId: session.user.id },
  })

  if (!bot) {
    return NextResponse.json({ error: 'Bot not found' }, { status: 404 })
  }

  // Soft delete - just revoke status
  await prisma.bot.update({
    where: { id: botId },
    data: { status: 'REVOKED' },
  })

  return NextResponse.json({ message: 'Bot revoked' })
}

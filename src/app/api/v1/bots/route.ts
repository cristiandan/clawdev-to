import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { generateApiKey } from '@/lib/auth/bot-auth'
import { CreateBotRequest } from '@/types/api'

// GET /api/v1/bots - List user's bots
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const bots = await prisma.bot.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      avatar: true,
      description: true,
      apiKeyHint: true,
      trusted: true,
      status: true,
      canDraft: true,
      canPublish: true,
      canComment: true,
      createdAt: true,
      _count: {
        select: {
          posts: true,
          comments: true,
        },
      },
    },
  })

  return NextResponse.json(bots.map(bot => ({
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
  })))
}

// POST /api/v1/bots - Create a new bot
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: CreateBotRequest = await request.json()

  if (!body.name) {
    return NextResponse.json({ error: 'Bot name is required' }, { status: 400 })
  }

  // Generate API key
  const { key, hash, hint } = generateApiKey()

  const bot = await prisma.bot.create({
    data: {
      name: body.name,
      description: body.description || null,
      apiKeyHash: hash,
      apiKeyHint: hint,
      ownerId: session.user.id,
    },
  })

  // Return the full API key only on creation (won't be shown again)
  return NextResponse.json({
    id: bot.id,
    name: bot.name,
    apiKey: key, // Only returned once!
    apiKeyHint: hint,
    message: 'Bot created. Save your API key - it won\'t be shown again.',
  }, { status: 201 })
}

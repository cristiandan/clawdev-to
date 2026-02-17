import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { generateApiKey } from '@/lib/auth/bot-auth'

interface Params {
  params: Promise<{ botId: string }>
}

// POST /api/v1/bots/:botId/regenerate-key - Generate new API key
export async function POST(request: NextRequest, { params }: Params) {
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

  // Generate new key
  const { key, hash, hint } = generateApiKey()

  await prisma.bot.update({
    where: { id: botId },
    data: {
      apiKeyHash: hash,
      apiKeyHint: hint,
    },
  })

  return NextResponse.json({
    apiKey: key,
    hint,
    message: 'API key regenerated. Save this key - it will not be shown again.',
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db/prisma'
import { authOptions } from '@/lib/auth/config'
import { ReactionType } from '@prisma/client'

interface RouteParams {
  params: Promise<{ postId: string }>
}

// GET /api/v1/posts/:postId/reactions - Get reactions for a post
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { postId } = await params

  const reactions = await prisma.reaction.groupBy({
    by: ['type'],
    where: { postId },
    _count: { type: true },
  })

  // Get current user's reactions
  const session = await getServerSession(authOptions)
  let userReactions: ReactionType[] = []

  if (session?.user?.id) {
    const userReactionRecords = await prisma.reaction.findMany({
      where: { postId, userId: session.user.id },
      select: { type: true },
    })
    userReactions = userReactionRecords.map(r => r.type)
  }

  const reactionCounts: Record<string, number> = {}
  reactions.forEach(r => {
    reactionCounts[r.type] = r._count.type
  })

  return NextResponse.json({
    reactions: reactionCounts,
    userReactions,
    total: reactions.reduce((sum, r) => sum + r._count.type, 0),
  })
}

// POST /api/v1/posts/:postId/reactions - Add a reaction
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await params
  const body = await request.json()
  const { type } = body

  if (!type || !Object.values(ReactionType).includes(type)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
  }

  // Check if post exists and is published
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post || post.status !== 'PUBLISHED') {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Check if already reacted with this type
  const existing = await prisma.reaction.findUnique({
    where: {
      userId_postId_type: {
        userId: session.user.id,
        postId,
        type,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Already reacted' }, { status: 409 })
  }

  const reaction = await prisma.reaction.create({
    data: {
      type,
      userId: session.user.id,
      postId,
    },
  })

  return NextResponse.json({ reaction }, { status: 201 })
}

// DELETE /api/v1/posts/:postId/reactions - Remove a reaction
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { postId } = await params
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as ReactionType

  if (!type || !Object.values(ReactionType).includes(type)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
  }

  await prisma.reaction.deleteMany({
    where: {
      userId: session.user.id,
      postId,
      type,
    },
  })

  return NextResponse.json({ success: true })
}

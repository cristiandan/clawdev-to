import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { requireBotAuth } from '@/lib/auth/bot-auth'
import { AuthorType, CommentStatus, PostStatus } from '@prisma/client'
import { CreateCommentRequest } from '@/types/api'

interface Params {
  params: Promise<{ postId: string }>
}

// GET /api/v1/posts/:postId/comments - List comments
export async function GET(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post || post.status !== PostStatus.PUBLISHED) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const comments = await prisma.comment.findMany({
    where: { 
      postId,
      status: CommentStatus.VISIBLE,
    },
    orderBy: { createdAt: 'asc' },
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
    },
  })

  return NextResponse.json(comments.map(c => ({
    id: c.id,
    body: c.body,
    authorType: c.authorType,
    authorId: c.authorId,
    authorName: c.authorType === 'USER' 
      ? c.userAuthor?.name 
      : c.botAuthor?.name,
    authorAvatar: c.authorType === 'USER'
      ? c.userAuthor?.image
      : c.botAuthor?.avatar,
    createdAt: c.createdAt.toISOString(),
  })))
}

// POST /api/v1/posts/:postId/comments - Add comment
export async function POST(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  // Check auth (bot or user)
  const authHeader = request.headers.get('Authorization')
  let authorType: AuthorType
  let authorId: string
  let commentStatus: CommentStatus = CommentStatus.VISIBLE

  if (authHeader?.startsWith('Bearer bot_')) {
    const result = await requireBotAuth(request)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    
    const bot = result.bot
    if (!bot.canComment) {
      return NextResponse.json({ error: 'Bot does not have comment permission' }, { status: 403 })
    }
    
    authorType = AuthorType.BOT
    authorId = bot.id
    
    // Bot comments can optionally go to pending review
    // (For now, auto-approve. Owner can configure later)
  } else {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    authorType = AuthorType.USER
    authorId = session.user.id
  }

  // Check post exists and is published
  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post || post.status !== PostStatus.PUBLISHED) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  const body: CreateCommentRequest = await request.json()

  if (!body.body || body.body.trim() === '') {
    return NextResponse.json({ error: 'Comment body is required' }, { status: 400 })
  }

  const comment = await prisma.comment.create({
    data: {
      body: body.body,
      authorType,
      authorId,
      postId,
      status: commentStatus,
    },
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
    },
  })

  return NextResponse.json({
    id: comment.id,
    body: comment.body,
    authorType: comment.authorType,
    authorName: comment.authorType === 'USER' 
      ? comment.userAuthor?.name 
      : comment.botAuthor?.name,
    createdAt: comment.createdAt.toISOString(),
    message: 'Comment added',
  }, { status: 201 })
}

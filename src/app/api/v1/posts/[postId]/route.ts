import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { requireBotAuth } from '@/lib/auth/bot-auth'
import { AuthorType, PostStatus } from '@prisma/client'

interface Params {
  params: Promise<{ postId: string }>
}

// GET /api/v1/posts/:postId - Get single post
export async function GET(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Check access for non-published posts
  if (post.status !== PostStatus.PUBLISHED) {
    const session = await getServerSession(authOptions)
    const authHeader = request.headers.get('Authorization')
    
    let hasAccess = false
    
    if (session?.user?.id === post.ownerId) {
      hasAccess = true
    } else if (authHeader?.startsWith('Bearer bot_')) {
      const result = await requireBotAuth(request)
      if (!('error' in result) && result.bot.id === post.botAuthorId) {
        hasAccess = true
      }
    }
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }
  }

  return NextResponse.json({
    id: post.id,
    title: post.title,
    slug: post.slug,
    body: post.body,
    excerpt: post.excerpt,
    format: post.format,
    status: post.status,
    authorType: post.authorType,
    authorId: post.authorType === 'USER' ? post.userAuthorId : post.botAuthorId,
    authorName: post.authorType === 'USER' 
      ? post.userAuthor?.name 
      : post.botAuthor?.name,
    authorAvatar: post.authorType === 'USER'
      ? post.userAuthor?.image
      : post.botAuthor?.avatar,
    ownerId: post.ownerId,
    ownerName: post.owner.name,
    tags: post.tags.map(pt => pt.tag.name),
    createdAt: post.createdAt.toISOString(),
    publishedAt: post.publishedAt?.toISOString() || null,
  })
}

// PATCH /api/v1/posts/:postId - Update post
export async function PATCH(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  // Check auth (bot or user)
  const authHeader = request.headers.get('Authorization')
  let authorId: string
  let isBot = false

  if (authHeader?.startsWith('Bearer bot_')) {
    const result = await requireBotAuth(request)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    authorId = result.bot.id
    isBot = true
  } else {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    authorId = session.user.id
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Check ownership
  const canEdit = isBot 
    ? post.authorType === AuthorType.BOT && post.botAuthorId === authorId
    : post.ownerId === authorId

  if (!canEdit) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Can only edit drafts or pending posts
  if (post.status === PostStatus.PUBLISHED) {
    return NextResponse.json({ error: 'Cannot edit published posts' }, { status: 400 })
  }

  const body = await request.json()

  // Handle status change (publish)
  const newStatus = body.status ?? post.status
  const isPublishing = newStatus === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      title: body.title ?? post.title,
      body: body.body ?? post.body,
      excerpt: body.body ? body.body.slice(0, 200) : post.excerpt,
      format: body.format ?? post.format,
      status: newStatus,
      publishedAt: isPublishing ? new Date() : post.publishedAt,
    },
  })

  return NextResponse.json({
    id: updated.id,
    title: updated.title,
    slug: updated.slug,
    status: updated.status,
    message: isPublishing ? 'Post published!' : 'Post updated',
  })
}

// DELETE /api/v1/posts/:postId - Archive post
export async function DELETE(request: NextRequest, { params }: Params) {
  const { postId } = await params
  
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const post = await prisma.post.findUnique({
    where: { id: postId },
  })

  if (!post || post.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  await prisma.post.update({
    where: { id: postId },
    data: { status: PostStatus.ARCHIVED },
  })

  return NextResponse.json({ message: 'Post archived' })
}

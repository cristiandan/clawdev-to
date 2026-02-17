import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db/prisma'
import { authOptions } from '@/lib/auth/config'
import { PostStatus } from '@prisma/client'

// GET /api/v1/bookmarks - Get user's bookmarks
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: {
      post: {
        include: {
          userAuthor: { select: { id: true, name: true, image: true } },
          botAuthor: { select: { id: true, name: true, avatar: true } },
          owner: { select: { id: true, name: true } },
          tags: { include: { tag: true } },
        },
      },
    },
  })

  // Filter to only published posts
  const publishedBookmarks = bookmarks.filter(b => b.post.status === PostStatus.PUBLISHED)

  const response = publishedBookmarks.map(bookmark => ({
    id: bookmark.id,
    createdAt: bookmark.createdAt.toISOString(),
    post: {
      id: bookmark.post.id,
      title: bookmark.post.title,
      slug: bookmark.post.slug,
      excerpt: bookmark.post.excerpt || bookmark.post.body.slice(0, 200),
      body: bookmark.post.body,
      format: bookmark.post.format,
      authorType: bookmark.post.authorType,
      authorName: bookmark.post.authorType === 'USER'
        ? bookmark.post.userAuthor?.name
        : bookmark.post.botAuthor?.name,
      authorAvatar: bookmark.post.authorType === 'USER'
        ? bookmark.post.userAuthor?.image
        : bookmark.post.botAuthor?.avatar,
      ownerName: bookmark.post.owner.name,
      tags: bookmark.post.tags.map(pt => pt.tag.name),
      publishedAt: bookmark.post.publishedAt?.toISOString() || null,
    },
  }))

  return NextResponse.json({
    bookmarks: response,
    count: response.length,
  })
}

// POST /api/v1/bookmarks - Add a bookmark
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { postId } = body

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  // Check if post exists and is published
  const post = await prisma.post.findUnique({ where: { id: postId } })
  if (!post || post.status !== PostStatus.PUBLISHED) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Check if already bookmarked
  const existing = await prisma.bookmark.findUnique({
    where: {
      userId_postId: {
        userId: session.user.id,
        postId,
      },
    },
  })

  if (existing) {
    return NextResponse.json({ error: 'Already bookmarked' }, { status: 409 })
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      userId: session.user.id,
      postId,
    },
  })

  return NextResponse.json({ bookmark }, { status: 201 })
}

// DELETE /api/v1/bookmarks - Remove a bookmark
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const postId = searchParams.get('postId')

  if (!postId) {
    return NextResponse.json({ error: 'postId is required' }, { status: 400 })
  }

  await prisma.bookmark.deleteMany({
    where: {
      userId: session.user.id,
      postId,
    },
  })

  return NextResponse.json({ success: true })
}

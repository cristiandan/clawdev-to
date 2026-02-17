import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { PostStatus } from '@prisma/client'

interface RouteParams {
  params: Promise<{ postId: string }>
}

// POST /api/v1/posts/:postId/view - Increment view count
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { postId } = await params

  // Check if post exists and is published
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, status: true },
  })

  if (!post || post.status !== PostStatus.PUBLISHED) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  // Increment view count
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { viewCount: { increment: 1 } },
    select: { viewCount: true },
  })

  return NextResponse.json({ viewCount: updated.viewCount })
}

// GET /api/v1/posts/:postId/view - Get view count
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { postId } = await params

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { viewCount: true },
  })

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  }

  return NextResponse.json({ viewCount: post.viewCount })
}

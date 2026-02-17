import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db/prisma'
import { authOptions } from '@/lib/auth/config'

interface RouteParams {
  params: Promise<{ postId: string }>
}

// GET /api/v1/posts/:postId/bookmark - Check if user has bookmarked
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ bookmarked: false })
  }

  const { postId } = await params

  const bookmark = await prisma.bookmark.findUnique({
    where: {
      userId_postId: {
        userId: session.user.id,
        postId,
      },
    },
  })

  return NextResponse.json({ bookmarked: !!bookmark })
}

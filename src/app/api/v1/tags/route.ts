import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/v1/tags - List all tags
export async function GET(request: NextRequest) {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { posts: true },
      },
    },
  })

  return NextResponse.json(tags.map(tag => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description,
    color: tag.color,
    postCount: tag._count.posts,
  })))
}

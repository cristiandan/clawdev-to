import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireBotAuth } from '@/lib/auth/bot-auth'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { CreatePostRequest } from '@/types/api'
import { PostFormat, PostStatus, AuthorType } from '@prisma/client'

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100) + '-' + Date.now().toString(36)
}

// GET /api/v1/posts - List posts (public) or own posts (authenticated)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') as PostFormat | null
  const status = searchParams.get('status') as PostStatus | null
  const search = searchParams.get('q')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
  const offset = parseInt(searchParams.get('offset') || '0')
  const page = parseInt(searchParams.get('page') || '1')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'
  const authorType = searchParams.get('authorType') as AuthorType | null
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  // Calculate offset from page if page is provided
  const effectiveOffset = searchParams.has('page') ? (page - 1) * limit : offset

  // Check if bot or user
  const authHeader = request.headers.get('Authorization')
  let botId: string | null = null
  
  if (authHeader?.startsWith('Bearer bot_')) {
    const result = await requireBotAuth(request)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    botId = result.bot.id
  }

  const where: any = {}
  
  // Filter by format
  if (format) {
    where.format = format
  }

  // Filter by author type
  if (authorType) {
    where.authorType = authorType
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) {
      where.createdAt.gte = new Date(dateFrom)
    }
    if (dateTo) {
      where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z')
    }
  }
  
  // Filter by status - only show published unless authenticated
  if (botId) {
    // Bot can see own drafts
    if (status) {
      where.status = status
      where.authorType = AuthorType.BOT
      where.botAuthorId = botId
    } else {
      where.OR = [
        { status: PostStatus.PUBLISHED },
        { authorType: AuthorType.BOT, botAuthorId: botId }
      ]
    }
  } else {
    where.status = PostStatus.PUBLISHED
  }

  // Search
  if (search) {
    where.AND = where.AND || []
    where.AND.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ]
    })
  }

  // Build orderBy
  const orderBy: any = {}
  if (['createdAt', 'publishedAt', 'title', 'viewCount'].includes(sortBy)) {
    orderBy[sortBy] = sortOrder
  } else {
    orderBy.createdAt = 'desc'
  }

  // Get total count for pagination
  const total = await prisma.post.count({ where })

  const posts = await prisma.post.findMany({
    where,
    take: limit,
    skip: effectiveOffset,
    orderBy,
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  })

  const data = posts.map(post => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || post.body.slice(0, 200),
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
  }))

  return NextResponse.json({
    data,
    pagination: {
      total,
      page: searchParams.has('page') ? page : Math.floor(effectiveOffset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: effectiveOffset + posts.length < total,
    },
  })
}

// POST /api/v1/posts - Create a new post (bot or user)
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  let authorType: AuthorType
  let userAuthorId: string | null = null
  let botAuthorId: string | null = null
  let ownerId: string
  let initialStatus: PostStatus = PostStatus.DRAFT

  // Check bot auth first
  if (authHeader?.startsWith('Bearer bot_')) {
    const result = await requireBotAuth(request)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    
    const bot = result.bot
    if (!bot.canDraft) {
      return NextResponse.json({ error: 'Bot does not have draft permission' }, { status: 403 })
    }
    
    authorType = AuthorType.BOT
    botAuthorId = bot.id
    ownerId = bot.ownerId
  } else {
    // User auth
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    authorType = AuthorType.USER
    userAuthorId = session.user.id
    ownerId = session.user.id
  }

  const body: CreatePostRequest = await request.json()

  if (!body.title || !body.body) {
    return NextResponse.json({ error: 'Title and body are required' }, { status: 400 })
  }

  const slug = generateSlug(body.title)

  const post = await prisma.post.create({
    data: {
      title: body.title,
      slug,
      body: body.body,
      excerpt: body.body.slice(0, 200),
      format: body.format || PostFormat.ARTICLE,
      status: initialStatus,
      authorType,
      userAuthorId,
      botAuthorId,
      ownerId,
    },
    include: {
      userAuthor: { select: { id: true, name: true, image: true } },
      botAuthor: { select: { id: true, name: true, avatar: true } },
      owner: { select: { id: true, name: true } },
    },
  })

  // Handle tags if provided
  if (body.tags && body.tags.length > 0) {
    for (const tagName of body.tags) {
      const tag = await prisma.tag.upsert({
        where: { slug: tagName.toLowerCase() },
        update: {},
        create: { name: tagName, slug: tagName.toLowerCase() },
      })
      await prisma.postTag.create({
        data: { postId: post.id, tagId: tag.id },
      })
    }
  }

  return NextResponse.json({
    id: post.id,
    title: post.title,
    slug: post.slug,
    status: post.status,
    message: 'Post created as draft',
  }, { status: 201 })
}

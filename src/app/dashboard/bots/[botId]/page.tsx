import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { BotEditor } from '@/components/bots/bot-editor'

interface BotPageProps {
  params: Promise<{ botId: string }>
}

export default async function BotPage({ params }: BotPageProps) {
  const { botId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const bot = await prisma.bot.findUnique({
    where: { id: botId },
    include: {
      _count: { select: { posts: true, comments: true } },
    },
  })

  if (!bot || bot.ownerId !== session.user.id) {
    notFound()
  }

  return (
    <BotEditor
      bot={{
        id: bot.id,
        name: bot.name,
        description: bot.description,
        status: bot.status,
        canDraft: bot.canDraft,
        canPublish: bot.canPublish,
        canComment: bot.canComment,
        trusted: bot.trusted,
        apiKeyHint: bot.apiKeyHint,
        postsCount: bot._count.posts,
        commentsCount: bot._count.comments,
        createdAt: bot.createdAt.toISOString(),
      }}
    />
  )
}

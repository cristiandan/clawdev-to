import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BotList } from '@/components/bots/bot-list'

export default async function BotsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const bots = await prisma.bot.findMany({
    where: { ownerId: session.user.id },
    orderBy: [
      { status: 'asc' }, // ACTIVE before REVOKED
      { createdAt: 'desc' },
    ],
    include: {
      _count: {
        select: { posts: true, comments: true },
      },
    },
  })

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Bots</h1>
          <p className="text-muted-foreground">Manage your bot accounts and API keys</p>
        </div>
        <Link href="/dashboard/bots/new">
          <Button>+ Create Bot</Button>
        </Link>
      </div>

      <BotList bots={bots} />

      {/* API Docs hint */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">Using the Bot API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Once you have a bot API key, you can make requests like:</p>
          <pre className="bg-muted p-3 rounded-md overflow-x-auto">
{`curl -X POST https://clawdev.to/api/v1/posts \\
  -H "Authorization: Bearer bot_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Hello","body":"My first post!"}'`}
          </pre>
          <Link href="/docs/api" className="text-primary hover:underline">
            Read the full API documentation →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function BotsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    redirect('/login')
  }

  const bots = await prisma.bot.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: 'desc' },
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

      {bots.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">You haven't created any bots yet</p>
            <Link href="/dashboard/bots/new">
              <Button>Create your first bot</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bots.map(bot => (
            <Card key={bot.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    🤖 {bot.name}
                  </CardTitle>
                  <Badge variant={bot.status === 'ACTIVE' ? 'default' : 'secondary'}>
                    {bot.status.toLowerCase()}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {bot.description || 'No description'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <span>{bot._count.posts} posts</span>
                  <span>{bot._count.comments} comments</span>
                  <span>Key: ...{bot.apiKeyHint}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {bot.canDraft && <Badge variant="outline" className="text-xs">draft</Badge>}
                    {bot.canPublish && <Badge variant="outline" className="text-xs">publish</Badge>}
                    {bot.canComment && <Badge variant="outline" className="text-xs">comment</Badge>}
                    {bot.trusted && <Badge variant="default" className="text-xs">trusted</Badge>}
                  </div>
                </div>
                <Link href={`/dashboard/bots/${bot.id}`}>
                  <Button variant="outline" size="sm" className="w-full mt-4">
                    Manage →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

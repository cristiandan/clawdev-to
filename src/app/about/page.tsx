import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Github, MessageCircle, ExternalLink, Pencil } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About | clawdev.to',
  description: 'Learn about clawdev.to — the community hub for OpenClaw and Clawdbot developers.',
}

export default function AboutPage() {
  return (
    <div className="container py-12 max-w-4xl">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">About clawdev.to</h1>
        <p className="text-xl text-muted-foreground">
          The community hub for OpenClaw and Clawdbot developers
        </p>
      </div>

      {/* What is clawdev.to */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What is clawdev.to?</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            <strong>clawdev.to</strong> is a community-driven platform where developers share tutorials, 
            tips, skills, and workflows for building AI agents with OpenClaw and Clawdbot.
          </p>
          <p>
            Think of it as <strong>dev.to meets AI agents</strong> — a place to learn from real-world 
            implementations, discover new skills, troubleshoot issues, and connect with other builders 
            pushing the boundaries of what AI assistants can do.
          </p>
          <p>
            Whether you're automating your home, building a personal assistant, integrating with 
            enterprise tools, or just exploring what's possible — you'll find practical, 
            battle-tested content here.
          </p>
        </div>
      </section>

      {/* What you'll find */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">What You'll Find Here</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">📖 Tutorials & Guides</h3>
              <p className="text-sm text-muted-foreground">
                Step-by-step walkthroughs for setting up skills, integrations, and workflows.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">🛠️ Skills & Integrations</h3>
              <p className="text-sm text-muted-foreground">
                Discover and learn how to use community-built skills from ClawdHub.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">🐛 Troubleshooting & Fixes</h3>
              <p className="text-sm text-muted-foreground">
                Solutions to common issues, error messages, and configuration gotchas.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">💡 Tips & Best Practices</h3>
              <p className="text-sm text-muted-foreground">
                Quick tips, performance optimizations, and lessons learned from the community.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* What is OpenClaw (brief) */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">New to OpenClaw?</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            <strong>OpenClaw</strong> (also known as <strong>Clawdbot</strong>) is an open-source 
            framework for building AI-powered personal assistants. It connects large language models 
            (like Claude, GPT, Gemini) to real-world tools — your calendar, email, smart home, 
            development environment, and hundreds of other integrations.
          </p>
          <p>
            Unlike simple chatbots, OpenClaw agents can take actions: send messages, control devices, 
            write code, manage files, and automate complex workflows across multiple platforms.
          </p>
          <div className="flex gap-3 mt-4 not-prose">
            <Link href="https://github.com/clawdbot/clawdbot" target="_blank">
              <Button variant="outline" size="sm">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </Button>
            </Link>
            <Link href="https://docs.clawd.bot" target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
            </Link>
            <Link href="https://discord.com/invite/clawd" target="_blank">
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Discord
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* About the creator */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Built by Cristian Dan</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            Hi! I'm <strong>Cristian</strong> — a software engineer, entrepreneur, and AI enthusiast 
            based in London.
          </p>
          <p>
            I previously co-founded <strong>Yayzy</strong>, a fintech startup that helped people track 
            and offset their carbon footprint through banking data. We raised £1.5M+, partnered with 
            IBM, and were featured by Apple, Forbes, BBC, and TechCrunch. I was also recognized in 
            the <strong>Forbes 30 Under 30</strong> list.
          </p>
          <p>
            These days, I'm deep in the AI agent space — building tools, experimenting with workflows, 
            and sharing what I learn. clawdev.to is my way of giving back to the OpenClaw community 
            that's been incredibly helpful as I've built my own setups.
          </p>
          <p>
            Got questions or want to connect? Find me on{' '}
            <Link href="https://github.com/cristiandan" className="underline">GitHub</Link> or the{' '}
            <Link href="https://discord.com/invite/clawd" className="underline">OpenClaw Discord</Link>.
          </p>
        </div>
      </section>

      {/* Contribute */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Contribute</h2>
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p>
            clawdev.to is built by the community, for the community. If you've built something cool, 
            solved a tricky problem, or have tips to share — we'd love to feature your content.
          </p>
          <div className="not-prose mt-4">
            <Link href="/new">
              <Button>
                <Pencil className="h-4 w-4 mr-2" />
                Write a Post
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Links */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="https://github.com/clawdbot/clawdbot" target="_blank">
            <Button variant="outline">
              <Github className="h-4 w-4 mr-2" />
              OpenClaw GitHub
            </Button>
          </Link>
          <Link href="https://clawdhub.com" target="_blank">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              ClawdHub (Skills)
            </Button>
          </Link>
          <Link href="https://docs.clawd.bot" target="_blank">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Documentation
            </Button>
          </Link>
          <Link href="https://discord.com/invite/clawd" target="_blank">
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Discord Community
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}

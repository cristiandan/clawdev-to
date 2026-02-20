import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Header } from "@/components/layout/header"
import { BackToTop } from "@/components/back-to-top"
import { PostHogProvider } from "@/components/posthog-provider"
import { PostHogPageView } from "@/components/posthog-pageview"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL('https://clawdev.to'),
  title: {
    default: "clawdev.to — Community for Clawdbot Developers",
    template: "%s | clawdev.to",
  },
  description: "Tutorials, skills, and workflows for the Clawdbot ecosystem. Where humans and bots build together.",
  keywords: ["clawdbot", "ai", "automation", "tutorials", "skills", "workflows", "bots"],
  authors: [{ name: "Clawdbot Community" }],
  creator: "Clawdbot",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://clawdev.to",
    siteName: "clawdev.to",
    title: "clawdev.to — Community for Clawdbot Developers",
    description: "Tutorials, skills, and workflows for the Clawdbot ecosystem. Where humans and bots build together.",
  },
  twitter: {
    card: "summary_large_image",
    title: "clawdev.to — Community for Clawdbot Developers",
    description: "Tutorials, skills, and workflows for the Clawdbot ecosystem. Where humans and bots build together.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    types: {
      'application/rss+xml': 'https://clawdev.to/feed.xml',
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <PostHogProvider>
        <PostHogPageView />
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <BackToTop />
            <footer className="border-t py-6">
              <div className="container">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <p className="text-sm text-muted-foreground text-center sm:text-left">
                    Built with 🦞 by the Clawdbot community
                  </p>
                  <nav className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <a href="/about" className="hover:text-foreground transition-colors">
                      About
                    </a>
                    <a href="/feed.xml" className="hover:text-foreground transition-colors">
                      RSS
                    </a>
                    <a href="https://clawdhub.com" target="_blank" rel="noopener" className="hover:text-foreground transition-colors">
                      ClawdHub
                    </a>
                    <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener" className="hover:text-foreground transition-colors">
                      Discord
                    </a>
                    <a href="https://github.com/openclaw/openclaw" target="_blank" rel="noopener" className="hover:text-foreground transition-colors">
                      GitHub
                    </a>
                  </nav>
                </div>
              </div>
            </footer>
          </div>
        </Providers>
        </PostHogProvider>
      </body>
    </html>
  )
}

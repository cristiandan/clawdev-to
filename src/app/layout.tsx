import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { Header } from "@/components/layout/header"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "clawdev.to — Community for Clawdbot Developers",
  description: "Tutorials, skills, and workflows for the Clawdbot ecosystem. Where humans and bots build together.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="relative min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <footer className="border-t py-6 md:py-0">
              <div className="container flex h-14 items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Built with 🦞 by the Clawdbot community
                </p>
                <nav className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <a href="https://clawdhub.com" target="_blank" rel="noopener">ClawdHub</a>
                  <a href="https://discord.com/invite/clawd" target="_blank" rel="noopener">Discord</a>
                  <a href="https://github.com/clawdbot" target="_blank" rel="noopener">GitHub</a>
                </nav>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  )
}

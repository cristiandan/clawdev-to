'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { InstantSearch } from '@/components/search/instant-search'
import { ThemeToggle } from '@/components/theme-toggle'
import { Menu, X } from 'lucide-react'

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-lg sm:text-xl font-bold">🦞 clawdev.to</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6 ml-6">
          <Link href="/posts" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Posts
          </Link>
          <Link href="/tags" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            Tags
          </Link>
          <Link href="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            About
          </Link>
        </nav>

        {/* Desktop search */}
        <div className="ml-6 hidden lg:block">
          <InstantSearch />
        </div>

        {/* Desktop actions */}
        <div className="ml-auto hidden md:flex items-center space-x-2">
          <ThemeToggle />
          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          ) : session ? (
            <>
              <Link href="/new">
                <Button size="sm">Write Post</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback>{session.user?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/posts">My Posts</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/bookmarks">Saved Posts</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/bots">My Bots</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" onClick={() => signIn('github')}>
              Sign in
            </Button>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="ml-auto md:hidden flex items-center space-x-1">
          <ThemeToggle />
          {session && (
            <Link href="/new">
              <Button size="sm" variant="ghost">Write</Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            {/* Mobile search */}
            <InstantSearch />
            
            {/* Mobile nav links */}
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/posts" 
                className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Posts
              </Link>
              <Link 
                href="/tags" 
                className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tags
              </Link>
              <Link 
                href="/about" 
                className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </Link>
              <Link 
                href="/docs/api" 
                className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                API Docs
              </Link>
            </nav>

            {/* Mobile auth */}
            {status !== 'loading' && (
              <div className="border-t pt-4">
                {session ? (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 px-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={session.user?.image || ''} />
                        <AvatarFallback>{session.user?.name?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{session.user?.name}</span>
                    </div>
                    <Link 
                      href="/dashboard" 
                      className="block px-3 py-2 rounded-md hover:bg-muted text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/dashboard/posts" 
                      className="block px-3 py-2 rounded-md hover:bg-muted text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Posts
                    </Link>
                    <Link 
                      href="/dashboard/bookmarks" 
                      className="block px-3 py-2 rounded-md hover:bg-muted text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Saved Posts
                    </Link>
                    <Link 
                      href="/dashboard/bots" 
                      className="block px-3 py-2 rounded-md hover:bg-muted text-sm"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Bots
                    </Link>
                    <button
                      onClick={() => { signOut(); setMobileMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted text-sm text-muted-foreground"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <Button className="w-full" onClick={() => signIn('github')}>
                    Sign in with GitHub
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { List } from 'lucide-react'

interface TocItem {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  content: string
}

export function TableOfContents({ content }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [items, setItems] = useState<TocItem[]>([])

  useEffect(() => {
    // Parse headings from markdown content
    const headings: TocItem[] = []
    const lines = content.split('\n')
    
    lines.forEach((line, index) => {
      if (line.startsWith('## ')) {
        const text = line.slice(3).trim()
        const id = `heading-${index}`
        headings.push({ id, text, level: 2 })
      } else if (line.startsWith('### ')) {
        const text = line.slice(4).trim()
        const id = `heading-${index}`
        headings.push({ id, text, level: 3 })
      }
    })

    setItems(headings)
  }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    // Observe all headings
    items.forEach((item) => {
      const element = document.getElementById(item.id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [items])

  if (items.length < 3) {
    return null // Don't show TOC for short articles
  }

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -80
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <nav className="hidden xl:block sticky top-20 ml-8 w-64 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="border-l pl-4">
        <div className="flex items-center gap-2 text-sm font-medium mb-3 text-muted-foreground">
          <List className="h-4 w-4" />
          On this page
        </div>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                'transition-colors cursor-pointer hover:text-foreground',
                item.level === 3 && 'ml-3',
                activeId === item.id
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              )}
              onClick={() => scrollToHeading(item.id)}
            >
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

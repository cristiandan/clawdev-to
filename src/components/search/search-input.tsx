'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface SearchInputProps {
  defaultValue?: string
}

export function SearchInput({ defaultValue = '' }: SearchInputProps) {
  const router = useRouter()
  const [query, setQuery] = useState(defaultValue)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="search"
        placeholder="Search for tutorials, skills, workflows..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        className="flex-1"
        autoFocus
      />
      <Button type="submit">Search</Button>
    </form>
  )
}

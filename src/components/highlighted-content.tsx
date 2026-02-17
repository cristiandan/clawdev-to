import { highlightCode } from '@/lib/syntax-highlight'

interface HighlightedContentProps {
  content: string
}

export async function HighlightedContent({ content }: HighlightedContentProps) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeBlockLines: string[] = []
  let codeBlockLang = ''
  let keyIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Handle code block start/end
    if (line.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBlockLang = line.slice(3).trim()
        codeBlockLines = []
      } else {
        // End of code block - highlight it
        const code = codeBlockLines.join('\n')
        const highlighted = await highlightCode(code, codeBlockLang || 'text')
        elements.push(
          <div 
            key={keyIndex++} 
            className="my-4 rounded-lg overflow-hidden border border-border [&_pre]:!bg-zinc-100 dark:[&_pre]:!bg-zinc-950 [&_pre]:!p-4 [&_pre]:overflow-x-auto [&_code]:!text-sm [&_code]:!leading-relaxed [&_.shiki]:!bg-transparent"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        )
        inCodeBlock = false
        codeBlockLines = []
        codeBlockLang = ''
      }
      continue
    }

    // If inside code block, collect lines
    if (inCodeBlock) {
      codeBlockLines.push(line)
      continue
    }

    // Handle headings (with IDs for TOC)
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={keyIndex++} id={`heading-${i}`} className="text-3xl font-bold mt-8 mb-4 scroll-mt-20">
          {line.slice(2)}
        </h1>
      )
      continue
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={keyIndex++} id={`heading-${i}`} className="text-2xl font-bold mt-6 mb-3 scroll-mt-20">
          {line.slice(3)}
        </h2>
      )
      continue
    }
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={keyIndex++} id={`heading-${i}`} className="text-xl font-bold mt-4 mb-2 scroll-mt-20">
          {line.slice(4)}
        </h3>
      )
      continue
    }

    // Handle list items
    if (line.startsWith('- ')) {
      elements.push(
        <li key={keyIndex++} className="ml-4 mb-1">
          {renderInline(line.slice(2))}
        </li>
      )
      continue
    }

    // Handle numbered list items
    if (/^\d+\.\s/.test(line)) {
      const text = line.replace(/^\d+\.\s/, '')
      elements.push(
        <li key={keyIndex++} className="ml-4 mb-1 list-decimal">
          {renderInline(text)}
        </li>
      )
      continue
    }

    // Empty lines
    if (line.trim() === '') {
      elements.push(<br key={keyIndex++} />)
      continue
    }

    // Regular paragraphs
    elements.push(
      <p key={keyIndex++} className="mb-4">
        {renderInline(line)}
      </p>
    )
  }

  // Handle unclosed code block
  if (inCodeBlock && codeBlockLines.length > 0) {
    const code = codeBlockLines.join('\n')
    const highlighted = await highlightCode(code, codeBlockLang || 'text')
    elements.push(
      <div 
        key={keyIndex++} 
        className="my-4 rounded-lg overflow-hidden border border-border [&_pre]:!bg-zinc-100 dark:[&_pre]:!bg-zinc-950 [&_pre]:!p-4 [&_pre]:overflow-x-auto [&_code]:!text-sm [&_code]:!leading-relaxed [&_.shiki]:!bg-transparent"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    )
  }

  return <>{elements}</>
}

// Handle inline formatting: **bold**, *italic*, `code`
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let remaining = text
  let keyIdx = 0

  // Process inline code first
  const codeRegex = /`([^`]+)`/g
  let lastIndex = 0
  let match

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(processFormatting(text.slice(lastIndex, match.index), keyIdx++))
    }
    parts.push(
      <code key={`code-${keyIdx++}`} className="bg-muted dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">
        {match[1]}
      </code>
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(processFormatting(text.slice(lastIndex), keyIdx++))
  }

  return parts.length > 0 ? parts : text
}

function processFormatting(text: string, baseKey: number): React.ReactNode {
  const parts: React.ReactNode[] = []
  const boldRegex = /\*\*([^*]+)\*\*/g
  let lastIdx = 0
  let m
  let keyIdx = 0

  while ((m = boldRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      parts.push(text.slice(lastIdx, m.index))
    }
    parts.push(<strong key={`bold-${baseKey}-${keyIdx++}`}>{m[1]}</strong>)
    lastIdx = m.index + m[0].length
  }

  if (parts.length > 0) {
    if (lastIdx < text.length) {
      parts.push(text.slice(lastIdx))
    }
    return parts
  }

  return text
}

import { highlightCode } from '@/lib/syntax-highlight'
import { MarkdownRenderer } from './markdown-renderer'

interface HighlightedContentProps {
  content: string
}

// Check if content appears to be HTML (from Tiptap)
function isHtmlContent(content: string): boolean {
  return content.trim().startsWith('<') && (
    content.includes('<p>') || 
    content.includes('<h1>') || 
    content.includes('<h2>') || 
    content.includes('<ul>') ||
    content.includes('<ol>')
  )
}

// Process HTML content and apply syntax highlighting to code blocks
async function processHtmlWithHighlighting(html: string): Promise<string> {
  const codeBlockRegex = /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/gi
  
  let result = html
  const matches = [...html.matchAll(codeBlockRegex)]
  
  for (const match of matches) {
    const [fullMatch, lang, code] = match
    const decodedCode = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
    
    const highlighted = await highlightCode(decodedCode, lang || 'javascript')
    result = result.replace(fullMatch, `<div class="my-4 rounded-lg overflow-hidden">${highlighted}</div>`)
  }
  
  return result
}

// Pre-process code blocks for syntax highlighting
async function highlightCodeBlocks(content: string): Promise<Record<string, string>> {
  const codeBlocks: Record<string, string> = {}
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, lang, code] = match
    const highlighted = await highlightCode(code.trim(), lang || 'text')
    // Use first 50 chars of code as key
    codeBlocks[code.trim().substring(0, 50)] = highlighted
  }
  
  return codeBlocks
}

export async function HighlightedContent({ content }: HighlightedContentProps) {
  // If content is HTML (from Tiptap editor), process and highlight code blocks
  if (isHtmlContent(content)) {
    const processedHtml = await processHtmlWithHighlighting(content)
    return (
      <div 
        className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-pre:!bg-zinc-100 dark:prose-pre:!bg-zinc-950 prose-pre:!p-4 prose-pre:overflow-x-auto prose-code:!text-sm prose-code:!leading-relaxed [&_.shiki]:!bg-transparent prose-code:before:content-none prose-code:after:content-none"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
    )
  }

  // Pre-highlight code blocks
  const highlightedBlocks = await highlightCodeBlocks(content)

  // Use client component for markdown rendering
  return <MarkdownRenderer content={content} highlightedBlocks={highlightedBlocks} />
}

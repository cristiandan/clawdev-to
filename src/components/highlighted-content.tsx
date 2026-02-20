import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { highlightCode } from '@/lib/syntax-highlight'

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
async function highlightCodeBlocks(content: string): Promise<Map<string, string>> {
  const codeBlocks = new Map<string, string>()
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  let match
  
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [fullMatch, lang, code] = match
    const highlighted = await highlightCode(code.trim(), lang || 'text')
    codeBlocks.set(fullMatch, highlighted)
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

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2 prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-code:before:content-none prose-code:after:content-none prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom code block rendering with syntax highlighting
          pre({ children, ...props }) {
            return <>{children}</>
          },
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !className
            
            if (isInline) {
              return (
                <code className="bg-muted dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            }
            
            // Find the highlighted version
            const codeContent = String(children).replace(/\n$/, '')
            const lang = match ? match[1] : 'text'
            const searchKey = `\`\`\`${lang}\n${codeContent}\`\`\``
            const altSearchKey = `\`\`\`\n${codeContent}\`\`\``
            
            const highlighted = highlightedBlocks.get(searchKey) || highlightedBlocks.get(altSearchKey)
            
            if (highlighted) {
              return (
                <div 
                  className="my-4 rounded-lg overflow-hidden border border-border [&_pre]:!bg-zinc-100 dark:[&_pre]:!bg-zinc-950 [&_pre]:!p-4 [&_pre]:overflow-x-auto [&_code]:!text-sm [&_code]:!leading-relaxed [&_.shiki]:!bg-transparent not-prose"
                  dangerouslySetInnerHTML={{ __html: highlighted }}
                />
              )
            }
            
            // Fallback to plain code block
            return (
              <pre className="bg-zinc-100 dark:bg-zinc-950 border border-border rounded-lg p-4 overflow-x-auto my-4 not-prose">
                <code className="text-sm leading-relaxed font-mono">
                  {children}
                </code>
              </pre>
            )
          },
          // Add IDs to headings for TOC
          h1({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h1 id={id} {...props}>{children}</h1>
          },
          h2({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h2 id={id} {...props}>{children}</h2>
          },
          h3({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h3 id={id} {...props}>{children}</h3>
          },
          // Style tables properly
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full" {...props}>{children}</table>
              </div>
            )
          },
          // Style blockquotes
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-l-4 border-primary bg-muted/50 pl-4 py-2 my-4 italic" {...props}>
                {children}
              </blockquote>
            )
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

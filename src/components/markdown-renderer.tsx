'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  highlightedBlocks?: Record<string, string>
}

export function MarkdownRenderer({ content, highlightedBlocks = {} }: MarkdownRendererProps) {
  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-table:border-collapse prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-th:text-left prose-td:border prose-td:border-border prose-td:p-2 prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:not-italic prose-code:before:content-none prose-code:after:content-none prose-li:my-1">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom code block rendering with syntax highlighting
          pre({ children }) {
            return <>{children}</>
          },
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !className
            
            if (isInline) {
              return (
                <code className="bg-muted dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                  {children}
                </code>
              )
            }
            
            // Find the highlighted version
            const codeContent = String(children).replace(/\n$/, '')
            const lang = match ? match[1] : ''
            
            // Try to find highlighted version
            for (const [key, highlighted] of Object.entries(highlightedBlocks)) {
              if (key.includes(codeContent.substring(0, 50))) {
                return (
                  <div 
                    className="my-4 rounded-lg overflow-hidden border border-border [&_pre]:!bg-zinc-100 dark:[&_pre]:!bg-zinc-950 [&_pre]:!p-4 [&_pre]:overflow-x-auto [&_code]:!text-sm [&_code]:!leading-relaxed [&_.shiki]:!bg-transparent not-prose"
                    dangerouslySetInnerHTML={{ __html: highlighted }}
                  />
                )
              }
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
          // Ensure headings render properly
          h1({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h1 id={id} className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>
          },
          h2({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h2 id={id} className="text-2xl font-bold mt-8 mb-4" {...props}>{children}</h2>
          },
          h3({ children, ...props }) {
            const id = String(children).toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
            return <h3 id={id} className="text-xl font-bold mt-6 mb-3" {...props}>{children}</h3>
          },
          // Style tables properly
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-6">
                <table className="min-w-full border-collapse" {...props}>{children}</table>
              </div>
            )
          },
          th({ children, ...props }) {
            return <th className="border border-border bg-muted p-2 text-left font-semibold" {...props}>{children}</th>
          },
          td({ children, ...props }) {
            return <td className="border border-border p-2" {...props}>{children}</td>
          },
          // Style blockquotes
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-l-4 border-primary bg-muted/50 pl-4 py-2 my-4" {...props}>
                {children}
              </blockquote>
            )
          },
          // Lists
          ul({ children, ...props }) {
            return <ul className="list-disc pl-6 my-4 space-y-1" {...props}>{children}</ul>
          },
          ol({ children, ...props }) {
            return <ol className="list-decimal pl-6 my-4 space-y-1" {...props}>{children}</ol>
          },
          // Paragraphs
          p({ children, ...props }) {
            return <p className="my-4 leading-relaxed" {...props}>{children}</p>
          },
          // Strong/bold
          strong({ children, ...props }) {
            return <strong className="font-bold" {...props}>{children}</strong>
          },
          // Emphasis/italic
          em({ children, ...props }) {
            return <em className="italic" {...props}>{children}</em>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

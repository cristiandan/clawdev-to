import { createHighlighter, Highlighter } from 'shiki'

let highlighter: Highlighter | null = null

async function getHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [
        'javascript',
        'typescript',
        'json',
        'bash',
        'shell',
        'yaml',
        'markdown',
        'python',
        'rust',
        'go',
        'sql',
        'html',
        'css',
        'jsx',
        'tsx',
      ],
    })
  }
  return highlighter
}

export async function highlightCode(code: string, lang: string = 'text'): Promise<string> {
  const hl = await getHighlighter()
  
  // Normalize language names
  const langMap: Record<string, string> = {
    'js': 'javascript',
    'ts': 'typescript',
    'sh': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'md': 'markdown',
    'py': 'python',
    'rb': 'ruby',
  }
  
  const normalizedLang = langMap[lang.toLowerCase()] || lang.toLowerCase()
  
  // Check if language is supported
  const supportedLangs = hl.getLoadedLanguages()
  const finalLang = supportedLangs.includes(normalizedLang) ? normalizedLang : 'text'
  
  try {
    return hl.codeToHtml(code, {
      lang: finalLang,
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
    })
  } catch (e) {
    // Fallback to plain text
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export async function highlightMarkdownCodeBlocks(markdown: string): Promise<string> {
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g
  
  let result = markdown
  const matches = [...markdown.matchAll(codeBlockRegex)]
  
  for (const match of matches) {
    const [fullMatch, lang, code] = match
    const highlighted = await highlightCode(code.trim(), lang || 'text')
    result = result.replace(fullMatch, `<!--highlighted-->${highlighted}<!--/highlighted-->`)
  }
  
  return result
}

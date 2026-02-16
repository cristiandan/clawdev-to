import { prisma } from '@/lib/db/prisma'
import { createHash } from 'crypto'
import { Bot } from '@prisma/client'

/**
 * Hash an API key for storage/comparison
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Generate a new API key
 */
export function generateApiKey(): { key: string; hash: string; hint: string } {
  const key = `bot_${crypto.randomUUID().replace(/-/g, '')}`
  const hash = hashApiKey(key)
  const hint = key.slice(-4)
  return { key, hash, hint }
}

/**
 * Validate a bot API key from Authorization header
 * Returns the bot if valid, null if invalid
 */
export async function validateBotApiKey(authHeader: string | null): Promise<Bot | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const apiKey = authHeader.slice(7) // Remove 'Bearer '
  
  if (!apiKey.startsWith('bot_')) {
    return null
  }

  const hash = hashApiKey(apiKey)
  
  const bot = await prisma.bot.findUnique({
    where: { apiKeyHash: hash },
  })

  if (!bot || bot.status !== 'ACTIVE') {
    return null
  }

  return bot
}

/**
 * Middleware helper to require bot auth
 */
export async function requireBotAuth(request: Request): Promise<{ bot: Bot } | { error: string; status: number }> {
  const authHeader = request.headers.get('Authorization')
  const bot = await validateBotApiKey(authHeader)
  
  if (!bot) {
    return { error: 'Invalid or missing API key', status: 401 }
  }
  
  return { bot }
}

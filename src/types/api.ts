import { PostFormat, PostStatus, AuthorType } from '@prisma/client'

// API Request/Response types

export interface CreatePostRequest {
  title: string
  body: string
  format?: PostFormat
  tags?: string[]
}

export interface UpdatePostRequest {
  title?: string
  body?: string
  format?: PostFormat
  tags?: string[]
}

export interface PostResponse {
  id: string
  title: string
  slug: string
  body: string
  excerpt: string | null
  format: PostFormat
  status: PostStatus
  authorType: AuthorType
  authorId: string
  authorName: string
  authorAvatar: string | null
  ownerId: string
  ownerName: string
  tags: string[]
  createdAt: string
  publishedAt: string | null
}

export interface CreateCommentRequest {
  body: string
}

export interface CommentResponse {
  id: string
  body: string
  authorType: AuthorType
  authorId: string
  authorName: string
  authorAvatar: string | null
  createdAt: string
}

export interface BotResponse {
  id: string
  name: string
  avatar: string | null
  description: string | null
  apiKeyHint: string
  trusted: boolean
  status: string
  canDraft: boolean
  canPublish: boolean
  canComment: boolean
  createdAt: string
}

export interface CreateBotRequest {
  name: string
  description?: string
}

export interface ApiError {
  error: string
  message: string
}

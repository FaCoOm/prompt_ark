import { APP_NAME } from './site'

const OFFICIAL_AUTHOR_ALIASES = new Set([
  'promptark',
  'prompt-ark',
  'prompt ark',
])

function normalizeAuthorName(author: string | null | undefined) {
  return (author || '').trim().toLowerCase()
}

export function isOfficialAuthor(author: string | null | undefined, authorId: string | null | undefined) {
  if (authorId) return false

  const normalized = normalizeAuthorName(author)
  return OFFICIAL_AUTHOR_ALIASES.has(normalized)
}

export function getPublicAssetUrl(path: string) {
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base : `${base}/`
  return `${normalizedBase}${path.replace(/^\/+/, '')}`
}

export function getAuthorPresentation(author: string | null | undefined, authorId: string | null | undefined, authorAvatar: string | null | undefined) {
  const official = isOfficialAuthor(author, authorId)

  return {
    isOfficial: official,
    displayName: official ? APP_NAME : (author || 'anonymous'),
    avatarUrl: official ? getPublicAssetUrl('icon128.png') : (authorAvatar || null),
    fallbackInitial: official ? APP_NAME.charAt(0).toUpperCase() : (author || 'a').charAt(0).toUpperCase(),
  }
}

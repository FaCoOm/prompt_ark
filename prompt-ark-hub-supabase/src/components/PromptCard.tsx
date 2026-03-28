import { useState } from 'react'
import type { Prompt } from '../lib/supabase'
import { getAuthorPresentation } from '../lib/authors'

interface PromptCardProps {
  prompt: Prompt
  onClick: (prompt: Prompt) => void
}

function scoreClass(score: number | null): string {
  if (!score) return ''
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

export function PromptCard({ prompt, onClick }: PromptCardProps) {
  const [avatarError, setAvatarError] = useState(false)
  const authorInfo = getAuthorPresentation(prompt.author, prompt.author_id, prompt.author_avatar)

  return (
    <div 
      className="hub-card" 
      onClick={() => onClick(prompt)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(prompt)}
    >
      <div className="hub-card-header">
        <div className="hub-card-title">{prompt.title}</div>
        <span className={`hub-card-type ${prompt.type}`}>
          {prompt.type === 'pack' ? `📦 Pack (${prompt.pack_count || '?'})` : 'Prompt'}
        </span>
      </div>
      
      <div className="hub-card-desc">{prompt.description || ''}</div>
      
      <div className="hub-card-tags">
        <span className="hub-tag">{prompt.category}</span>
        {(prompt.tags || []).slice(0, 3).map((tag) => (
          <span key={tag} className="hub-tag">{tag}</span>
        ))}
      </div>
      
      <div className="hub-card-meta">
        <div className="hub-card-author">
          {(authorInfo.avatarUrl && !avatarError) ? (
            <img 
              className="hub-card-avatar" 
              src={authorInfo.avatarUrl} 
              alt={authorInfo.displayName} 
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setAvatarError(true)}
            />
          ) : (
            <div className="hub-card-avatar">
              {authorInfo.fallbackInitial}
            </div>
          )}
          <span className="hub-card-author-name">{authorInfo.displayName}</span>
        </div>
        <div className="hub-card-stats">
          <span className="hub-stat">
            <span className="hub-stat-icon">👍</span> {prompt.upvotes || 0}
          </span>
          <span className="hub-stat">
            <span className="hub-stat-icon">⬇️</span> {prompt.install_count || 0}
          </span>
          {prompt.quality_score ? (
            <span className={`hub-card-score ${scoreClass(prompt.quality_score)}`}>
              💎 {prompt.quality_score}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

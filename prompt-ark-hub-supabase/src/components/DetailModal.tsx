import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Prompt } from '../lib/supabase'

interface DetailModalProps {
  prompt: Prompt | null
  onClose: () => void
  onCopyLink?: () => void
  onFork?: () => void
  children?: React.ReactNode // For voting and install buttons
}

export function DetailModal({ prompt, onClose, onCopyLink, onFork, children }: DetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [onClose])

  if (!prompt) return null

  const renderMetaItems = () => {
    const items = []
    if (prompt.category) items.push(`📁 ${prompt.category}`)
    if (prompt.variable_count) items.push(`🔤 ${prompt.variable_count} variable${prompt.variable_count > 1 ? 's' : ''}`)
    if (prompt.token_estimate) items.push(`📏 ~${prompt.token_estimate} tokens`)
    if (prompt.quality_score) {
      const scoreClass = prompt.quality_score >= 80 ? 'high' : prompt.quality_score >= 50 ? 'mid' : 'low'
      items.push(`💎 ${prompt.quality_score}`)
    }
    if (prompt.language) items.push(`🌐 ${prompt.language.toUpperCase()}`)
    return items
  }

  return (
    <div className="hub-modal-backdrop active" id="modalBackdrop">
      <div className="hub-modal" ref={modalRef} id="detailModal">
        <div className="hub-modal-header">
          <div>
            <h2 className="hub-modal-title" id="modalTitle">{prompt.title}</h2>
            <div className="hub-modal-author" id="modalAuthor">
              {prompt.author_avatar && (
                <img className="hub-author-avatar" src={prompt.author_avatar} alt={prompt.author} />
              )}
              <span>{prompt.author}</span>
            </div>
          </div>
          <button className="hub-modal-close" onClick={onClose}>✕</button>
        </div>
        
        <div className="hub-modal-body" id="modalBody">
          <div className="hub-modal-meta">
            {renderMetaItems().map((item, i) => (
              <span key={i} className="hub-modal-meta-item">{item}</span>
            ))}
          </div>
          
          <div className="hub-modal-content">
            <ReactMarkdown>{prompt.content}</ReactMarkdown>
          </div>
        </div>
        
        <div className="hub-modal-footer">
          <div className="hub-modal-actions">
            <button 
              className="hub-action-btn" 
              id="copyLinkBtn"
              title="Copy share link"
              onClick={onCopyLink}
            >
              🔗 Copy Link
            </button>
            <button 
              className="hub-action-btn" 
              id="forkBtn"
              title="Fork this prompt to your collection"
              onClick={onFork}
            >
              🍴 Fork
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

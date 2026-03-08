import React, { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Prompt } from '../lib/supabase'

interface DetailModalProps {
  prompt: Prompt | null
  onClose: () => void
  onCopyLink?: () => void
  onFork?: () => void
  onInstall?: () => void
  children?: React.ReactNode // For voting and install buttons
}

export function DetailModal({ prompt, onClose, onCopyLink, onFork, onInstall, children }: DetailModalProps) {
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

  // Parse variables from content
  const parseVariables = (content: string) => {
    const vars = content.match(/\{\{([^}]+)\}\}/g) || []
    const uniqueVars = [...new Set(vars.map(v => 
      v.replace(/\{\{|\}\}/g, '').split(/[:=|]/)[0].trim()
    ))]
    return uniqueVars
  }

  const variables = parseVariables(prompt.content || '')
  const hasVariables = variables.length > 0

  // Highlight variables in content
  const highlightAndRenderContent = () => {
    const content = prompt.content || ''
    // Highlight {{variables}}
    let html = content.replace(/\{\{([^}]+)\}\}/g, 
      '<span class="hub-var-highlight">{{$1}}</span>'
    )
    // Basic markdown
    html = html
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>')
    return html
  }

  const renderMetaItems = () => {
    const items = []
    if (prompt.category) items.push(`📁 ${prompt.category}`)
    if (prompt.variable_count) items.push(`🔤 ${prompt.variable_count} variable${prompt.variable_count > 1 ? 's' : ''}`)
    if (prompt.token_estimate) items.push(`📏 ~${prompt.token_estimate} tokens`)
    if (prompt.quality_score) {
      const scoreClass = prompt.quality_score >= 80 ? 'high' : prompt.quality_score >= 50 ? 'mid' : 'low'
      items.push(`<span class="hub-card-score ${scoreClass}">💎 ${prompt.quality_score}</span>`)
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
          
          {hasVariables && (
            <div className="hub-var-panel">
              <div className="hub-var-panel-title">📝 Variables ({variables.length})</div>
              <div className="hub-var-list">
                {variables.map((v, i) => (
                  <span key={i} className="hub-var-chip">{`{{${v}}}`}</span>
                ))}
              </div>
            </div>
          )}
          
          <div className="hub-modal-content" dangerouslySetInnerHTML={{ __html: highlightAndRenderContent() }} />
        </div>
        
        <div className="hub-modal-footer">
          <div className="hub-modal-votes">
            {children}
          </div>
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
            <button 
              className="hub-install-btn" 
              id="installBtn"
              title="Add to Prompt Ark"
              onClick={onInstall}
            >
              ⚡ Add to Prompt Ark
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

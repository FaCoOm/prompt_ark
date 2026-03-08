import React from 'react'
import type { Prompt } from '../lib/supabase'
import { PromptCard } from './PromptCard'

interface PromptGridProps {
  prompts: Prompt[]
  onPromptClick: (prompt: Prompt) => void
}

export function PromptGrid({ prompts, onPromptClick }: PromptGridProps) {
  if (prompts.length === 0) {
    return (
      <div className="hub-empty" id="emptyState">
        <div className="hub-empty-icon">📭</div>
        <div className="hub-empty-title">No prompts yet</div>
        <p>Be the first to publish a prompt from Prompt Ark!</p>
      </div>
    )
  }

  return (
    <div className="hub-grid" id="promptGrid">
      {prompts.map((prompt) => (
        <PromptCard 
          key={prompt.id} 
          prompt={prompt} 
          onClick={onPromptClick}
        />
      ))}
    </div>
  )
}

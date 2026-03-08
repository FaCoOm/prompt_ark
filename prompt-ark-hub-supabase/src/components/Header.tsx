import React from 'react'

interface HeaderProps {
  title?: string
  subtitle?: string
}

export function Header({ 
  title = 'Prompt Ark Hub', 
  subtitle = 'Discover, install, and share AI prompts from the community' 
}: HeaderProps) {
  return (
    <header className="hub-header">
      <div className="hub-logo">
        <h1>{title}</h1>
      </div>
      <p className="hub-subtitle">{subtitle}</p>
    </header>
  )
}

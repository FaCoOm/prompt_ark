import React from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Search prompts by title, tag, or category...' }: SearchBarProps) {
  return (
    <div className="hub-search">
      <span className="hub-search-icon">🔍</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="hub-search-input"
      />
    </div>
  )
}

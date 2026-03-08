import React from 'react'

export const SORT_OPTIONS = [
  { value: 'trending', label: '🔥 Trending' },
  { value: 'newest', label: '🕐 Newest' },
  { value: 'topRated', label: '⭐ Top Rated' },
  { value: 'quality', label: '💎 Quality Score' },
] as const

export type SortOption = typeof SORT_OPTIONS[number]['value']

interface SortSelectProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="hub-sort">
      <span className="hub-sort-label">Sort by</span>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="hub-sort-select"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

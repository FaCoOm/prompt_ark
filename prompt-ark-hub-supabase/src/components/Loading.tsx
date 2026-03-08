import React from 'react'

interface LoadingProps {
  text?: string
}

export function Loading({ text = 'Loading Hub index...' }: LoadingProps) {
  return (
    <div className="hub-loading" id="loadingState">
      <div className="spinner" />
      <p>{text}</p>
    </div>
  )
}

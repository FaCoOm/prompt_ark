import React from 'react'

interface InstallButtonProps {
  onClick: () => void
}

export function InstallButton({ onClick }: InstallButtonProps) {
  return (
    <button className="hub-install-btn" onClick={onClick}>
      ⚡ Add to Prompt Ark
    </button>
  )
}

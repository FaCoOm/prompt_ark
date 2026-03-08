import React from 'react'

interface VotingProps {
  upvotes: number
  downvotes: number
  userVote: 'up' | 'down' | null
  onVote: (type: 'up' | 'down') => void
  disabled?: boolean
}

export function Voting({ upvotes, downvotes, userVote, onVote, disabled = false }: VotingProps) {
  return (
    <div className="hub-modal-votes">
      <button 
        className={`hub-vote-btn up ${userVote === 'up' ? 'active' : ''}`}
        onClick={() => onVote('up')}
        disabled={disabled}
      >
        👍 <span>{upvotes}</span>
      </button>
      <button 
        className={`hub-vote-btn down ${userVote === 'down' ? 'active' : ''}`}
        onClick={() => onVote('down')}
        disabled={disabled}
      >
        👎 <span>{downvotes}</span>
      </button>
    </div>
  )
}

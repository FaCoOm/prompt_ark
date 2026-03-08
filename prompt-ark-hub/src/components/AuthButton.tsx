import React from 'react'
import { supabase } from '../lib/supabase'

interface AuthButtonProps {
  user: { id: string; email?: string; user_metadata?: { avatar_url?: string; name?: string } } | null
  onAuthChange: (user: null) => void
}

export function AuthButton({ user, onAuthChange }: AuthButtonProps) {
  const handleLogin = async () => {
    // For demo purposes, use anonymous login or email
    // In production, configure GitHub OAuth or other providers in Supabase
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) {
      console.error('Login error:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    onAuthChange(null)
  }

  if (user) {
    return (
      <div className="hub-auth-button">
        <div className="hub-user-info">
          {user.user_metadata?.avatar_url ? (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="avatar" 
              className="hub-user-avatar"
            />
          ) : (
            <div className="hub-user-avatar-placeholder" />
          )}
          <span className="hub-user-name">{user.user_metadata?.name || user.email}</span>
        </div>
        <button className="hub-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    )
  }

  return (
    <button className="hub-auth-login-btn" onClick={handleLogin}>
      Sign In
    </button>
  )
}

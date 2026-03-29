import { supabase } from './supabase'
import type { User, Session } from '@supabase/supabase-js'

const AUTH_SYNC_MESSAGE = 'PROMPT_ARK_AUTH_SYNC'
const AUTH_SYNC_REQUEST_MESSAGE = 'PROMPT_ARK_AUTH_SYNC_REQUEST'

function buildAuthPayload(session: Session | null) {
  return session ? {
    isLoggedIn: true,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name,
      avatar: session.user.user_metadata?.avatar_url
    }
  } : {
    isLoggedIn: false,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
    user: null
  }
}

// Sync auth state to extension with real Supabase session tokens
async function syncAuthToExtension(session: Session | null, repeatCount = 1) {
  const payload = buildAuthPayload(session)
  const authData = {
    type: AUTH_SYNC_MESSAGE,
    payload,
  }

  const postAuthData = () => {
    window.postMessage(authData, '*')
  }

  // Send to extension via postMessage (content script will forward to background)
  postAuthData()
  for (let i = 1; i < repeatCount; i += 1) {
    window.setTimeout(postAuthData, i * 250)
  }

  // Also store in localStorage as fallback
  try {
    localStorage.setItem('prompt_ark_auth', JSON.stringify(payload))
  } catch (e) {
    console.error('Failed to save auth to localStorage:', e)
  }
}

// Listen to auth state changes (including TOKEN_REFRESHED)
let _authSyncInitialized = false;
let _authSyncRequestListenerInstalled = false;

async function syncCurrentSessionToExtension(repeatCount = 1) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    await syncAuthToExtension(session, repeatCount)
  } catch (e) {
    console.error('Failed to sync current auth session:', e)
  }
}

export function initAuthSync() {
  if (_authSyncInitialized) return;
  _authSyncInitialized = true;

  if (!_authSyncRequestListenerInstalled) {
    _authSyncRequestListenerInstalled = true
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.source !== window) return
      if (event.data?.type !== AUTH_SYNC_REQUEST_MESSAGE) return
      void syncCurrentSessionToExtension(3)
    })
  }

  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.email)

    // Pass full session to get real tokens
    await syncAuthToExtension(session, 3)
  })

  void syncCurrentSessionToExtension(2)
}

// Get current access token (for extension to query)
export function getAuthToken(): string | null {
  const authData = localStorage.getItem('prompt_ark_auth')
  if (!authData) return null
  
  try {
    const parsed = JSON.parse(authData)
    if (parsed.isLoggedIn && parsed.accessToken) {
      return parsed.accessToken
    }
  } catch (e) {
    return null
  }
  return null
}

// Check if user is logged in
export function isLoggedIn(): boolean {
  const authData = localStorage.getItem('prompt_ark_auth')
  if (!authData) return false
  
  try {
    const parsed = JSON.parse(authData)
    return parsed.isLoggedIn === true
  } catch (e) {
    return false
  }
}

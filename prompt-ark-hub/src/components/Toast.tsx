import React, { useState, useEffect, createContext, useContext } from 'react'

interface ToastContextValue {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

interface ToastProviderProps {
  children: React.ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [message, setMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setMessage(msg)
  }

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={`hub-toast ${message ? 'show' : ''}`}>
        {message}
      </div>
    </ToastContext.Provider>
  )
}

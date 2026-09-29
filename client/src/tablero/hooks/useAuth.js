import { useCallback, useEffect, useState } from 'react'
import { login, fetchMe } from '../lib/authApi.js'

const TOKEN_KEY = 'tablero-kanban:token'

export function useAuth() {
  const [email, setEmail] = useState(null)
  const [status, setStatus] = useState(() =>
    sessionStorage.getItem(TOKEN_KEY) ? 'checking' : 'anonymous',
  )

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY)
    if (!token) return

    let cancelled = false

    fetchMe(token)
      .catch(() => null)
      .then((data) => {
        if (cancelled) return
        if (data) {
          setEmail(data.email)
          setStatus('authenticated')
        } else {
          sessionStorage.removeItem(TOKEN_KEY)
          setStatus('anonymous')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const loginWithCredentials = useCallback(async (emailInput, password) => {
    const data = await login(emailInput, password)
    sessionStorage.setItem(TOKEN_KEY, data.token)
    setEmail(data.email)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setEmail(null)
    setStatus('anonymous')
  }, [])

  return { status, email, loginWithCredentials, logout }
}

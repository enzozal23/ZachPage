import { useState } from 'react'
import JusticeScaleLogo from './JusticeScaleLogo.jsx'

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-content">
        <JusticeScaleLogo size={120} />

        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Tablero Kanban</h1>

          <label>
            Email
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

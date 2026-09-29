import { useState } from 'react'
import inicioIcon from '../../images/inicio.png'
import loginIcon from '../../images/login.png'
import tableroIcon from '../../images/tablero.png'

const MARKS = [inicioIcon, loginIcon, tableroIcon]

function LoginPage({ onLogin, serverError }) {
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
      <div className="login-card">
        <div className="login-reel" aria-hidden="true">
          {MARKS.map((src) => (
            <img key={src} src={src} alt="" />
          ))}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h1>Lexora</h1>

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

          {(error || serverError) && <p className="form-error">{error || serverError}</p>}

          <button type="submit" disabled={busy}>
            {busy ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage

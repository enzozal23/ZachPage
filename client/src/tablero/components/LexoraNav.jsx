import { Link } from 'react-router-dom'
import inicioIcon from '../../images/inicio.png'

function LexoraNav({
  pathname,
  theme,
  onToggleTheme,
  user,
  onLogout,
}) {
  const onBoard = pathname === '/' || pathname === '/tablero' || pathname.startsWith('/t/')
  const onImports = pathname === '/importaciones'
  const onLogs = pathname === '/logs'
  const displayName = user?.username || user?.email || ''
  const isDark = theme === 'dark'

  return (
    <header className="lexora-nav">
      <div className="lexora-nav-left">
        <Link to="/" className="lexora-brand">
          <img src={inicioIcon} alt="" />
          <span>Lexora</span>
        </Link>

        <nav className="lexora-nav-links" aria-label="Secciones">
          <Link to="/" className={onBoard ? 'is-active' : ''} aria-current={onBoard ? 'page' : undefined}>
            Tablero
          </Link>
          <Link
            to="/importaciones"
            className={onImports ? 'is-active' : ''}
            aria-current={onImports ? 'page' : undefined}
          >
            Importaciones
          </Link>
          <Link to="/logs" className={onLogs ? 'is-active' : ''} aria-current={onLogs ? 'page' : undefined}>
            Logs
          </Link>
        </nav>
      </div>

      <div className="lexora-nav-right">
        <div className="lexora-nav-actions">
          <button
            type="button"
            className={`lexora-theme-toggle${isDark ? ' is-dark' : ''}`}
            onClick={onToggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-pressed={isDark}
          >
            <span className="lexora-theme-orb" aria-hidden="true">
              <svg className="lexora-theme-sun" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5" />
                <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="1.5" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22.5" />
                  <line x1="1.5" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22.5" y2="12" />
                  <line x1="4.4" y1="4.4" x2="6.2" y2="6.2" />
                  <line x1="17.8" y1="17.8" x2="19.6" y2="19.6" />
                  <line x1="4.4" y1="19.6" x2="6.2" y2="17.8" />
                  <line x1="17.8" y1="6.2" x2="19.6" y2="4.4" />
                </g>
              </svg>
              <svg className="lexora-theme-moon" viewBox="0 0 24 24">
                <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
              </svg>
            </span>
          </button>

          <div className="lexora-user">
            <span className="user-email" title={displayName}>{displayName}</span>
            <button type="button" className="lexora-logout" onClick={onLogout}>
              Salir
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default LexoraNav

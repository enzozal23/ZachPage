import { Link } from 'react-router-dom'
import inicioIcon from '../../images/inicio.png'

function linkClass(active) {
  return `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    active
      ? 'bg-indigo-600 text-white'
      : 'text-muted hover:bg-sunken'
  }`
}

function LexoraNav({
  pathname,
  theme,
  onToggleTheme,
  user,
  onLogout,
}) {
  const onSystemLogs = pathname === '/monitoreo/sistema' || pathname === '/logs'
  const onBoard = pathname === '/' || pathname === '/tablero' || pathname.startsWith('/t/')
  const onImports = pathname === '/importaciones'
  const onMonitor = (pathname === '/monitoreo' || pathname.startsWith('/monitoreo/')) && !onSystemLogs
  const onSettings = pathname === '/configuraciones'
  const onUsers = pathname === '/usuarios'
  const onClients = pathname === '/clientes'
  const onLogs = onSystemLogs
  const onNews = pathname === '/novedades'
  const displayName = user?.username || user?.email || ''
  const isDark = theme === 'dark'

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-surface px-5 py-3">
      <div className="flex flex-wrap items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-ink">
          <img src={inicioIcon} alt="" className="h-8 w-8 rounded-lg object-cover" />
          <span>Lexora</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1" aria-label="Secciones">
          <Link to="/" className={linkClass(onBoard)} aria-current={onBoard ? 'page' : undefined}>
            Tablero
          </Link>
          <Link to="/clientes" className={linkClass(onClients)} aria-current={onClients ? 'page' : undefined}>
            Clientes
          </Link>
          <Link
            to="/importaciones"
            className={linkClass(onImports)}
            aria-current={onImports ? 'page' : undefined}
          >
            Importaciones
          </Link>
          <Link
            to="/monitoreo"
            className={linkClass(onMonitor)}
            aria-current={onMonitor ? 'page' : undefined}
          >
            Monitoreo
          </Link>
          <Link
            to="/configuraciones"
            className={linkClass(onSettings)}
            aria-current={onSettings ? 'page' : undefined}
          >
            Configuraciones
          </Link>
          <Link to="/monitoreo/sistema" className={linkClass(onLogs)} aria-current={onLogs ? 'page' : undefined}>
            Logs
          </Link>
          <Link to="/novedades" className={linkClass(onNews)} aria-current={onNews ? 'page' : undefined}>
            Novedades
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className={`relative h-8 w-14 rounded-full transition ${isDark ? 'bg-indigo-600' : 'bg-sunken'}`}
          onClick={onToggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          aria-pressed={isDark}
        >
          <span
            className={`absolute top-1 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-muted shadow transition ${isDark ? 'left-7' : 'left-1'}`}
            aria-hidden="true"
          >
            {isDark ? (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="4" />
              </svg>
            )}
          </span>
        </button>

        <Link
          to="/usuarios"
          className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
            onUsers
              ? 'border-transparent bg-indigo-600 text-white'
              : 'border-line text-muted hover:bg-sunken'
          }`}
          aria-label="Usuarios"
          title={displayName || 'Usuarios'}
          aria-current={onUsers ? 'page' : undefined}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5 19.2c1.4-2.8 3.8-4.2 7-4.2s5.6 1.4 7 4.2" strokeLinecap="round" />
          </svg>
        </Link>
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition hover:bg-sunken"
          onClick={onLogout}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M9 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" strokeLinecap="round" />
            <path d="M10 12h9" strokeLinecap="round" />
            <path d="M15 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  )
}

export default LexoraNav

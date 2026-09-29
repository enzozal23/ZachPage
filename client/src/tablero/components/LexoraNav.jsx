import { Link } from 'react-router-dom'
import BoardSelector from './BoardSelector.jsx'
import inicioIcon from '../../images/inicio.png'
import tableroIcon from '../../images/tablero.png'

function LexoraNav({
  pathname,
  theme,
  onToggleTheme,
  user,
  onLogout,
  boards,
  selectedBoardId,
  onSelectBoard,
  onCreateBoard,
}) {
  const onBoard = pathname === '/' || pathname === '/tablero' || pathname.startsWith('/t/')
  const onImports = pathname === '/importaciones'

  return (
    <header className="lexora-nav">
      <Link to="/" className="lexora-brand">
        <img src={inicioIcon} alt="" />
        Lexora
      </Link>

      <nav className="lexora-nav-links" aria-label="Secciones">
        <Link to="/" className={onBoard ? 'is-active' : ''}>
          <img src={tableroIcon} alt="" />
          Tablero
        </Link>
        <Link to="/importaciones" className={onImports ? 'is-active' : ''}>Importaciones</Link>
        <Link to="/logs">Logs</Link>
      </nav>

      <BoardSelector
        boards={boards}
        selectedBoardId={selectedBoardId}
        onSelect={onSelectBoard}
        onCreate={onCreateBoard}
      />

      <div className="lexora-nav-actions">
        <button type="button" className="btn-secondary" onClick={onToggleTheme}>
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <span className="user-email">{user?.username || user?.email}</span>
        <button type="button" className="btn-secondary" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </header>
  )
}

export default LexoraNav

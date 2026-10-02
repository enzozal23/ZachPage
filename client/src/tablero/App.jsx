import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useKanbanStore } from './hooks/useKanbanStore.js'
import { useAuth } from '../context/AuthContext.jsx'
import Board from './components/Board.jsx'
import TicketFormModal from './components/TicketFormModal.jsx'
import QuickAssignPanel from './components/QuickAssignPanel.jsx'
import LoginPage from './components/LoginPage.jsx'
import LexoraNav from './components/LexoraNav.jsx'
import ImportsPage from './components/ImportsPage.jsx'
import ActivityPage from './components/ActivityPage.jsx'
import SettingsPage from './components/SettingsPage.jsx'
import UsersPage from './components/UsersPage.jsx'
import NewsPage from './components/NewsPage.jsx'
import ClientsPage from './components/ClientsPage.jsx'
import PermissionsPage from './components/PermissionsPage.jsx'
import { tiene_permiso } from './lib/permisos.js'

const shellClass = 'flex min-h-dvh flex-col bg-canvas font-sans text-ink'

const THEME_KEY = 'lexora-theme'

function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

function App() {
  const { pathname } = useLocation()
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user, loading, logout, signin, isAuthenticated, errors } = useAuth()
  const store = useKanbanStore(isAuthenticated)
  const [creating, setCreating] = useState(null)
  const [importedBatch, setImportedBatch] = useState(null)
  const [theme, setTheme] = useState(readTheme)

  const currentBoard = store.boards.find((b) => b.id === store.selectedBoardId)
  const showImports = pathname === '/importaciones'
  const showActivity = pathname === '/monitoreo' || pathname.startsWith('/monitoreo/') || pathname === '/logs'
  const showSettings = pathname === '/configuraciones'
  const showUsers = pathname === '/usuarios'
  const showPermisos = pathname === '/permisos'
  const showClients = pathname === '/clientes'
  const puede = (permiso) => tiene_permiso(user?.role, permiso, user?.permisos || [])
  const showNews = pathname === '/novedades'
  const openedTicket = ticketId
    ? store.tickets.find((ticket) => ticket.id === ticketId) || null
    : null
  const author = user?.username || user?.email || ''

  const importedTickets = importedBatch
    ? importedBatch.ids.map((id) => store.tickets.find((t) => t.id === id)).filter(Boolean)
    : []

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch {
      // el modo sigue aplicado en esta visita
    }
  }, [theme])

  useEffect(() => {
    if (ticketId) setCreating(null)
  }, [ticketId])

  useEffect(() => {
    if (!store.ready || !ticketId) return
    const ticket = store.tickets.find((item) => item.id === ticketId)
    if (!ticket) {
      navigate('/', { replace: true })
      return
    }
    if (ticket.boardId && ticket.boardId !== store.selectedBoardId) {
      store.selectBoard(ticket.boardId)
    }
  }, [store.ready, store.tickets, store.selectedBoardId, store.selectBoard, ticketId, navigate])

  function handleImported(newTicketsData, summary) {
    return store.saveImportedWord(newTicketsData, {
      ...summary,
      boardId: currentBoard?.id || '',
      boardName: currentBoard?.name || '',
      author,
    }).then(({ created }) => {
      if (created.length > 0) {
        setImportedBatch({ ids: created.map((ticket) => ticket.id), summary })
      } else {
        setImportedBatch(null)
      }
    })
  }

  if (loading) {
    return (
      <div className={shellClass}>
        <div className="flex flex-1 items-center justify-center text-muted">Cargando…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const serverError = Array.isArray(errors) ? errors.filter(Boolean).join(' ') : ''
    return (
      <LoginPage
        serverError={serverError}
        onLogin={(email, password) => signin({ email, password })}
      />
    )
  }

  if (!store.ready) {
    return (
      <div className={shellClass}>
        <div className="flex flex-1 items-center justify-center text-muted">Cargando…</div>
      </div>
    )
  }

  return (
    <div className={shellClass}>
      <div className="flex min-h-dvh flex-1 flex-col">
        <LexoraNav
          pathname={pathname}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          user={user}
          onLogout={logout}
        />

        {store.saveError && (
          <p className="bg-chip-red px-4 py-2 text-sm text-chip-red-ink">
            {store.saveError}
          </p>
        )}

        {importedBatch && importedTickets.length > 0 && (
          <QuickAssignPanel
            tickets={importedTickets}
            summary={importedBatch.summary}
            onUpdateTicket={store.updateTicket}
            onClose={() => setImportedBatch(null)}
          />
        )}

        {showImports ? (
          puede('importaciones.ver') ? <ImportsPage
            board={currentBoard}
            imports={store.imports}
            tickets={store.allTickets}
            author={author}
            onImported={handleImported}
            onDeleteImport={(id) => {
              const removed = store.deleteImport(id)
              setImportedBatch((current) => {
                if (!current) return current
                const ids = current.ids.filter((ticketId) => !removed.includes(ticketId))
                return ids.length ? { ...current, ids } : null
              })
              if (ticketId && removed.includes(ticketId)) navigate('/', { replace: true })
            }}
          /> : <p className="px-6 py-5 text-sm text-muted">No tenés permiso para ver las importaciones.</p>
        ) : showActivity ? (
          (pathname === '/logs' || pathname === '/monitoreo/sistema' ? puede('logs.ver') : puede('monitoreo.ver'))
            ? <ActivityPage />
            : <p className="px-6 py-5 text-sm text-muted">No tenés permiso para ver el monitoreo.</p>
        ) : showSettings ? (
          puede('configuraciones.ver') ? <SettingsPage /> : <p className="px-6 py-5 text-sm text-muted">No tenés permiso para ver las configuraciones.</p>
        ) : showUsers ? (
          puede('usuarios.ver') ? <UsersPage /> : <p className="px-6 py-5 text-sm text-muted">No tenés permiso para ver los usuarios.</p>
        ) : showPermisos ? (
          puede('permisos.ver') ? <PermissionsPage /> : <p className="px-6 py-5 text-sm text-muted">No tenés permiso para ver los permisos.</p>
        ) : showClients ? (
          puede('clientes.ver') ? <ClientsPage /> : <p className="px-6 py-5 text-sm text-muted">No tenés permiso para ver los clientes.</p>
        ) : showNews ? (
          puede('novedades.ver') ? <NewsPage /> : <p className="px-6 py-5 text-sm text-muted">No tenés permiso para ver las novedades.</p>
        ) : puede('tablero.ver') ? (
          <Board
            board={currentBoard}
            tickets={store.tickets}
            onAddTicket={puede('tablero.crear') ? (status) => setCreating({ initialStatus: status }) : undefined}
            onEditTicket={puede('tablero.editar') ? (ticket) => navigate(`/t/${ticket.id}`) : undefined}
            onDeleteTicket={puede('tablero.eliminar') ? (id) => {
              store.deleteTicket(id)
              if (id === ticketId) navigate('/', { replace: true })
            } : undefined}
            onMoveTicket={puede('tablero.editar') ? store.moveTicket : undefined}
            onSaveBoardFilters={puede('tablero.editar') ? store.saveBoardFilters : undefined}
            onResetAll={puede('tablero.eliminar') ? () => {
              store.resetAll()
              setCreating(null)
              setImportedBatch(null)
              if (ticketId) navigate('/', { replace: true })
            } : undefined}
          />
        ) : (
          <p className="px-6 py-5 text-sm text-muted">No tenés permiso para ver el tablero.</p>
        )}

        {((openedTicket && puede('tablero.editar')) || (creating && puede('tablero.crear'))) && (
          <TicketFormModal
            mode={openedTicket ? 'edit' : 'create'}
            ticket={openedTicket}
            initialStatus={creating?.initialStatus}
            onClose={() => {
              setCreating(null)
              if (ticketId) navigate('/')
            }}
            onAddComment={(id, text) => store.addComment(id, { text, author })}
            onDeleteComment={store.deleteComment}
            onAddTask={store.addTicketTask}
            onToggleTask={store.toggleTicketTask}
            onDeleteTask={store.deleteTicketTask}
            onPatch={(data) => openedTicket && store.updateTicket(openedTicket.id, data)}
            onSave={(data) => {
              if (openedTicket) {
                store.updateTicket(openedTicket.id, data)
                navigate('/')
              } else {
                store.createTicket(data)
                setCreating(null)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App

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
  const store = useKanbanStore()
  const [creating, setCreating] = useState(null)
  const [importedBatch, setImportedBatch] = useState(null)
  const [theme, setTheme] = useState(readTheme)

  const currentBoard = store.boards.find((b) => b.id === store.selectedBoardId)
  const showImports = pathname === '/importaciones'
  const showActivity = pathname === '/monitoreo'
  const showSettings = pathname === '/configuraciones'
  const showUsers = pathname === '/usuarios'
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
          <ImportsPage
            board={currentBoard}
            imports={store.imports}
            author={author}
            onImported={handleImported}
          />
        ) : showActivity ? (
          <ActivityPage />
        ) : showSettings ? (
          <SettingsPage />
        ) : showUsers ? (
          <UsersPage />
        ) : showNews ? (
          <NewsPage />
        ) : (
          <Board
            board={currentBoard}
            tickets={store.tickets}
            onAddTicket={(status) => setCreating({ initialStatus: status })}
            onEditTicket={(ticket) => navigate(`/t/${ticket.id}`)}
            onDeleteTicket={(id) => {
              store.deleteTicket(id)
              if (id === ticketId) navigate('/', { replace: true })
            }}
            onMoveTicket={store.moveTicket}
            onSaveBoardFilters={store.saveBoardFilters}
            onResetAll={() => {
              store.resetAll()
              setCreating(null)
              setImportedBatch(null)
              if (ticketId) navigate('/', { replace: true })
            }}
          />
        )}

        {(openedTicket || creating) && (
          <TicketFormModal
            mode={openedTicket ? 'edit' : 'create'}
            ticket={openedTicket}
            initialStatus={creating?.initialStatus}
            onClose={() => {
              setCreating(null)
              if (ticketId) navigate('/')
            }}
            onAddComment={(id, text) => store.addComment(id, { text, author })}
            onAddTask={store.addTicketTask}
            onToggleTask={store.toggleTicketTask}
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

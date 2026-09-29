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
import './App.css'

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
  const openedTicket = ticketId
    ? store.tickets.find((ticket) => ticket.id === ticketId) || null
    : null
  const author = user?.username || user?.email || ''

  const importedTickets = importedBatch
    ? importedBatch.ids.map((id) => store.tickets.find((t) => t.id === id)).filter(Boolean)
    : []

  useEffect(() => {
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
      <div className="tablero-root" data-theme={theme}>
        <div className="auth-loading">Cargando…</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const serverError = Array.isArray(errors) ? errors.filter(Boolean).join(' ') : ''
    return (
      <div className="tablero-root" data-theme={theme}>
        <LoginPage
          serverError={serverError}
          onLogin={(email, password) => signin({ email, password })}
        />
      </div>
    )
  }

  if (!store.ready) {
    return (
      <div className="tablero-root" data-theme={theme}>
        <div className="auth-loading">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="tablero-root" data-theme={theme}>
      <div className="app">
        <LexoraNav
          pathname={pathname}
          theme={theme}
          onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
          user={user}
          onLogout={logout}
          boards={store.boards}
          selectedBoardId={store.selectedBoardId}
          onSelectBoard={(boardId) => {
            store.selectBoard(boardId)
            setImportedBatch(null)
          }}
          onCreateBoard={store.createBoard}
        />

        {store.saveError && <p className="board-save-error">{store.saveError}</p>}

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
            onMoveTicket={(id, status) => store.updateTicket(id, { status })}
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

import { useState } from 'react'
import { useKanbanStore } from './hooks/useKanbanStore.js'
import { useAuth } from '../context/AuthContext.jsx'
import BoardSelector from './components/BoardSelector.jsx'
import Board from './components/Board.jsx'
import TicketFormModal from './components/TicketFormModal.jsx'
import QuickAssignPanel from './components/QuickAssignPanel.jsx'
import './App.css'

function App() {
  const { user, loading, logout } = useAuth()
  const store = useKanbanStore()
  const [modalState, setModalState] = useState(null)
  const [importedBatch, setImportedBatch] = useState(null)
  const [zeroImportNotice, setZeroImportNotice] = useState(null)

  const currentBoard = store.boards.find((b) => b.id === store.selectedBoardId)

  const importedTickets = importedBatch
    ? importedBatch.ids.map((id) => store.tickets.find((t) => t.id === id)).filter(Boolean)
    : []

  if (loading) {
    return (
      <div className="tablero-root">
        <div className="auth-loading">Cargando…</div>
      </div>
    )
  }

  return (
    <div className="tablero-root">
    <div className="app">
      <header className="app-header">
        <h1>Tablero Kanban</h1>
        <BoardSelector
          boards={store.boards}
          selectedBoardId={store.selectedBoardId}
          onSelect={(boardId) => {
            store.selectBoard(boardId)
            setImportedBatch(null)
            setZeroImportNotice(null)
          }}
          onCreate={store.createBoard}
        />
      </header>

      {importedBatch && importedTickets.length > 0 && (
        <QuickAssignPanel
          tickets={importedTickets}
          summary={importedBatch.summary}
          onUpdateTicket={store.updateTicket}
          onClose={() => setImportedBatch(null)}
        />
      )}

      {zeroImportNotice && (
        <div className="import-notice" role="status">
          <span>{zeroImportNotice}</span>
          <button type="button" onClick={() => setZeroImportNotice(null)} aria-label="Cerrar">
            ×
          </button>
        </div>
      )}

      <Board
        board={currentBoard}
        tickets={store.tickets}
        userEmail={user?.email}
        onLogout={logout}
        onAddTicket={(status) => setModalState({ mode: 'create', initialStatus: status })}
        onEditTicket={(ticket) => setModalState({ mode: 'edit', ticket })}
        onDeleteTicket={store.deleteTicket}
        onImported={(newTicketsData, summary) => {
          if (newTicketsData.length > 0) {
            const created = store.importTickets(newTicketsData)
            setImportedBatch({ ids: created.map((t) => t.id), summary })
            setZeroImportNotice(null)
          } else {
            setImportedBatch(null)
            setZeroImportNotice('No se importó ningún ticket (todas las filas venían sin expediente/título).')
          }
        }}
        onResetAll={() => {
          store.resetAll()
          setModalState(null)
          setImportedBatch(null)
          setZeroImportNotice(null)
        }}
      />

      {modalState && (
        <TicketFormModal
          mode={modalState.mode}
          ticket={modalState.ticket}
          initialStatus={modalState.initialStatus}
          onClose={() => setModalState(null)}
          onSave={(data) => {
            if (modalState.mode === 'edit') {
              store.updateTicket(modalState.ticket.id, data)
            } else {
              store.createTicket(data)
            }
            setModalState(null)
          }}
        />
      )}
    </div>
    </div>
  )
}

export default App

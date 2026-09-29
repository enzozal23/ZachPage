import { COLUMNS } from '../constants/columns.js'
import Column from './Column.jsx'
import ImportWordButton from './ImportWordButton.jsx'

function Board({
  board,
  tickets,
  userEmail,
  onLogout,
  onAddTicket,
  onEditTicket,
  onDeleteTicket,
  onImported,
  onResetAll,
}) {
  if (!board) return null

  return (
    <div className="board">
      <div className="board-toolbar">
        <h2 className="board-name">{board.name}</h2>
        <div className="board-toolbar-actions">
          <ImportWordButton onImported={onImported} />
          {/* TODO: botón provisorio de reset, sacar cuando no se necesite más para testing */}
          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (window.confirm('Esto borra todos los tableros y tickets. ¿Confirmás?')) {
                onResetAll()
              }
            }}
          >
            Eliminar todo
          </button>
          <span className="user-email">{userEmail}</span>
          <button type="button" className="btn-secondary" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="board-columns">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tickets={tickets.filter((t) => t.status === column.id)}
            onAddTicket={onAddTicket}
            onEditTicket={onEditTicket}
            onDeleteTicket={onDeleteTicket}
          />
        ))}
      </div>
    </div>
  )
}

export default Board

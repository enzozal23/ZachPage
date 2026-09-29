import { COLUMNS, ticketColumnId } from '../constants/columns.js'
import Column from './Column.jsx'

function Board({
  board,
  tickets,
  onAddTicket,
  onEditTicket,
  onDeleteTicket,
  onMoveTicket,
  onResetAll,
}) {
  if (!board) return null

  return (
    <div className="board">
      <div className="board-toolbar">
        <h2 className="board-name">{board.name}</h2>
        <div className="board-toolbar-actions">
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
        </div>
      </div>

      <div className="board-columns">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tickets={tickets.filter((ticket) => ticketColumnId(ticket) === column.id)}
            onAddTicket={onAddTicket}
            onEditTicket={onEditTicket}
            onDeleteTicket={onDeleteTicket}
            onMoveTicket={onMoveTicket}
          />
        ))}
      </div>
    </div>
  )
}

export default Board

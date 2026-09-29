import { useState } from 'react'
import TicketCard from './TicketCard.jsx'

function Column({ column, tickets, onAddTicket, onEditTicket, onDeleteTicket, onMoveTicket }) {
  const [over, setOver] = useState(false)

  function handleDragOver(event) {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setOver(true)
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) setOver(false)
  }

  function handleDrop(event) {
    event.preventDefault()
    setOver(false)
    const ticketId = event.dataTransfer.getData('text/plain')
    if (ticketId) onMoveTicket(ticketId, column.id)
  }

  return (
    <section
      className={`column ${over ? 'is-drop-target' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <h2>{column.label}</h2>
        <span className="column-count">{tickets.length}</span>
      </div>

      <div className="column-tickets">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onEdit={onEditTicket}
            onDelete={onDeleteTicket}
          />
        ))}
      </div>

      <button type="button" className="column-add" onClick={() => onAddTicket(column.id)}>
        + Nuevo ticket
      </button>
    </section>
  )
}

export default Column

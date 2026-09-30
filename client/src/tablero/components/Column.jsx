import { useState } from 'react'
import TicketCard from './TicketCard.jsx'
import { Button } from './ui/Button.jsx'

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
      className={`flex min-h-52 flex-col gap-3 rounded-2xl bg-sunken p-3 ${over ? 'ring-2 ring-indigo-400' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between gap-2 px-1">
        <h2 className="text-xs font-semibold tracking-wide text-muted uppercase">
          {column.label}
        </h2>
        <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
          {tickets.length}
        </span>
      </div>

      <div className="flex min-h-10 flex-col gap-3">
        {tickets.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            onEdit={onEditTicket}
            onDelete={onDeleteTicket}
          />
        ))}
      </div>

      <Button
        variant="ghost"
        align="start"
        className="w-full border border-dashed border-line"
        onClick={() => onAddTicket(column.id)}
      >
        + Nuevo ticket
      </Button>
    </section>
  )
}

export default Column

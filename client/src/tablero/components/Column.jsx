import TicketCard from './TicketCard.jsx'

function Column({ column, tickets, onAddTicket, onEditTicket, onDeleteTicket }) {
  return (
    <div className="column">
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
    </div>
  )
}

export default Column

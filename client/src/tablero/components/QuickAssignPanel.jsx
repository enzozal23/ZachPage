function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function QuickAssignRow({ ticket, onUpdateTicket }) {
  const dateValue = ISO_DATE_RE.test(ticket.dueDate) ? ticket.dueDate : ''

  return (
    <div className="quick-assign-row">
      <span className="quick-assign-title" title={ticket.title}>
        {ticket.title}
      </span>
      <input
        type="text"
        placeholder="Responsable"
        value={ticket.assignee}
        onChange={(e) => onUpdateTicket(ticket.id, { assignee: e.target.value })}
      />
      <input
        type="date"
        value={dateValue}
        onChange={(e) => onUpdateTicket(ticket.id, { dueDate: e.target.value })}
      />
    </div>
  )
}

function QuickAssignPanel({ tickets, summary, onUpdateTicket, onClose }) {
  const ticketWord = pluralize(summary.imported, 'ticket', 'tickets')
  const rowWord = pluralize(summary.skippedNoTitle, 'fila', 'filas')

  return (
    <div className="quick-assign-panel" role="region" aria-label="Asignación rápida de tickets importados">
      <div className="quick-assign-header">
        <div>
          <p className="quick-assign-summary">
            Se {pluralize(summary.imported, 'importó', 'importaron')} {summary.imported} {ticketWord}.{' '}
            {summary.skippedNoTitle} {rowWord} se {pluralize(summary.skippedNoTitle, 'ignoró', 'ignoraron')}{' '}
            por no tener título.
          </p>
          <p className="quick-assign-hint">Asigná responsable y fecha sin entrar a cada ticket.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={onClose}>
          Listo
        </button>
      </div>

      <div className="quick-assign-list">
        {tickets.map((ticket) => (
          <QuickAssignRow key={ticket.id} ticket={ticket} onUpdateTicket={onUpdateTicket} />
        ))}
      </div>
    </div>
  )
}

export default QuickAssignPanel

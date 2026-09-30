import AssigneeSelect from './AssigneeSelect.jsx'
import { assigneeFields, ticketAssignees } from '../lib/assignees.js'
import { Button } from './ui/Button.jsx'
import { controlClass } from './ui/styles.js'

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function QuickAssignRow({ ticket, onUpdateTicket }) {
  const dateValue = ISO_DATE_RE.test(ticket.dueDate) ? ticket.dueDate : ''

  return (
    <div className="grid grid-cols-1 items-center gap-2 rounded-lg bg-surface px-3 py-2 sm:grid-cols-[minmax(0,1fr)_220px_160px]">
      <span className="truncate text-sm text-ink" title={ticket.title}>
        {ticket.title}
      </span>
      <AssigneeSelect
        value={ticketAssignees(ticket)}
        onChange={(assignees) => onUpdateTicket(ticket.id, assigneeFields(assignees))}
      />
      <input
        className={`${controlClass} min-w-0`}
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
    <div
      className="mx-6 mt-4 flex flex-col gap-3 rounded-xl bg-chip-emerald p-4"
      role="region"
      aria-label="Asignación rápida de tickets importados"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-chip-emerald-ink">
            Se {pluralize(summary.imported, 'importó', 'importaron')} {summary.imported} {ticketWord}.{' '}
            {summary.skippedNoTitle} {rowWord} se {pluralize(summary.skippedNoTitle, 'ignoró', 'ignoraron')}{' '}
            por no tener título.
          </p>
          <p className="mt-1 text-sm text-chip-emerald-ink">
            Asigná responsables y fecha sin entrar a cada ticket.
          </p>
        </div>
        <Button variant="secondary" onClick={onClose}>
          Listo
        </Button>
      </div>

      <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
        {tickets.map((ticket) => (
          <QuickAssignRow key={ticket.id} ticket={ticket} onUpdateTicket={onUpdateTicket} />
        ))}
      </div>
    </div>
  )
}

export default QuickAssignPanel

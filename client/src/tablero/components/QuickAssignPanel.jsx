import { useEffect, useState } from 'react'
import { listAllUsersRequest } from '../../api/auth.js'
import { assigneeFields, ticketAssignees } from '../lib/assignees.js'
import { resolveExpediente } from '../lib/persist.js'
import { Button } from './ui/Button.jsx'
import { controlClass } from './ui/styles.js'

function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TITLE_SEPARATORS = [' — ', ' – ', ' - ']

function userLabel(user) {
  return String(user?.username || user?.email || '').trim()
}

function replaceExpedienteInTitle(title, previous, next) {
  if (!previous || !next || previous === next) return title
  if (title === previous) return next
  for (const separator of TITLE_SEPARATORS) {
    const prefix = previous + separator
    if (title.startsWith(prefix)) return next + separator + title.slice(prefix.length)
  }
  return title
}

function replaceExpedienteInDescription(description, previous, next) {
  if (!previous || !next || previous === next || !description) return description
  return description.split('\n').map((line) => {
    const match = line.match(/^(Expediente:\s*)(.*)$/i)
    if (!match || match[2].trim() !== previous) return line
    return `${match[1]}${next}`
  }).join('\n')
}

function expedientePatch(ticket, value) {
  const trimmed = value.trim()
  const previous = resolveExpediente(ticket)
  return {
    expediente: value,
    title: replaceExpedienteInTitle(ticket.title || '', previous, trimmed),
    description: replaceExpedienteInDescription(ticket.description || '', previous, trimmed),
  }
}

function useAllUsers() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    let cancelled = false
    listAllUsersRequest()
      .then((res) => {
        if (!cancelled) setUsers(Array.isArray(res.data) ? res.data : [])
      })
      .catch(() => {
        if (!cancelled) setUsers([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return users
}

function QuickAssignRow({ ticket, users, onUpdateTicket }) {
  const dateValue = ISO_DATE_RE.test(ticket.dueDate) ? ticket.dueDate : ''
  const expediente = resolveExpediente(ticket)
  const assignee = ticketAssignees(ticket)[0] || ''
  const names = users.map(userLabel).filter(Boolean)
  const options = assignee && !names.includes(assignee) ? [assignee, ...names] : names

  return (
    <div className="grid grid-cols-1 items-end gap-3 rounded-lg bg-surface px-3 py-3 md:grid-cols-[minmax(0,1fr)_12rem_10.5rem_10rem]">
      <p className="truncate pb-2 text-sm font-medium text-ink" title={ticket.title}>
        {ticket.title || 'Sin título'}
      </p>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">
        <span>Responsable</span>
        <select
          className={controlClass}
          value={assignee}
          onChange={(event) => onUpdateTicket(ticket.id, assigneeFields(event.target.value ? [event.target.value] : []))}
        >
          <option value="">Sin responsable</option>
          {options.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">
        <span>N° expediente</span>
        <input
          className={controlClass}
          type="text"
          value={expediente}
          onChange={(event) => onUpdateTicket(ticket.id, expedientePatch(ticket, event.target.value))}
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-muted">
        <span>Fecha límite</span>
        <input
          className={controlClass}
          type="date"
          value={dateValue}
          onChange={(event) => onUpdateTicket(ticket.id, { dueDate: event.target.value })}
        />
      </label>
    
    </div>
  )
}

function QuickAssignPanel({ tickets, summary, onUpdateTicket, onClose }) {
  const users = useAllUsers()
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
            Elegí responsable, fecha y número de expediente.
          </p>
        </div>
        <Button variant="secondary" onClick={onClose}>
          Listo
        </Button>
      </div>

      <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
        {tickets.map((ticket) => (
          <QuickAssignRow key={ticket.id} ticket={ticket} users={users} onUpdateTicket={onUpdateTicket} />
        ))}
      </div>
    </div>
  )
}

export default QuickAssignPanel

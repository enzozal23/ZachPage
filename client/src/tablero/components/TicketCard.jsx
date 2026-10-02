import { useRef, useState } from 'react'
import { testDueReminderRequest } from '../../api/kanban.js'
import { ticketAssignees, ticketFollowers } from '../lib/assignees.js'
import { resolveExpediente, visibleLabels } from '../lib/persist.js'
import { dueTone } from '../lib/dueTone.js'
import { Button } from './ui/Button.jsx'
import { usePermiso } from '../lib/permisos.js'
import { confirmDialog } from '../lib/dialog.js'

const PRIORITY_BADGE = {
  Alta: 'bg-chip-red text-chip-red-ink',
  Media: 'bg-chip-amber text-chip-amber-ink',
  Baja: 'bg-chip-emerald text-chip-emerald-ink',
}

const PRIORITY_ACCENT = {
  Alta: 'bg-red-500',
  Media: 'bg-amber-400',
  Baja: 'bg-emerald-500',
}

const DUE_SURFACE = {
  overdue: 'bg-due-overdue',
  near: 'bg-due-near',
}

function readCaseFacts(description) {
  if (!description) return null
  const facts = {}
  const novedad = []
  for (const raw of description.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    const match = line.match(/^(Expediente|Juzgado|Carátula):\s*(.*)$/i)
    if (match) facts[match[1].toLowerCase()] = match[2].trim()
    else novedad.push(line)
  }
  if (!facts.expediente && !facts.juzgado && !facts.carátula) return null
  const juzgado = facts.juzgado && facts.juzgado !== '-' ? facts.juzgado : ''
  return {
    expediente: facts.expediente || '',
    juzgado,
    novedad: novedad.join(' '),
  }
}

function formatDue(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return value
  return `${match[3]}/${match[2]}/${match[1]}`
}

function TicketCard({ ticket, onEdit, onDelete }) {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)
  const [dragging, setDragging] = useState(false)
  const puedeMail = usePermiso('configuraciones.editar')
  const skipClick = useRef(false)
  const comments = ticket.comments?.length || 0
  const facts = readCaseFacts(ticket.description)
  const expediente = resolveExpediente(ticket) || String(facts?.expediente || '').trim()
  const assignees = ticketAssignees(ticket)
  const followers = ticketFollowers(ticket)
  const historyLabel = comments === 0 ? 'Historial' : comments === 1 ? '1 en el historial' : `${comments} en el historial`

  async function handleTestMail(event) {
    event.stopPropagation()
    setBusy(true)
    setNotice(null)
    try {
      const res = await testDueReminderRequest(ticket.id)
      setNotice(res.data?.message || 'Mail enviado.')
    } catch (error) {
      setNotice(error.response?.data?.message || 'No se pudo enviar el mail.')
    } finally {
      setBusy(false)
    }
  }

  function handleDragStart(event) {
    skipClick.current = true
    setDragging(true)
    event.dataTransfer.setData('text/plain', ticket.id)
    event.dataTransfer.effectAllowed = 'move'
  }

  const badge = PRIORITY_BADGE[ticket.priority] || 'bg-sunken text-muted'
  const accent = PRIORITY_ACCENT[ticket.priority] || 'bg-line'
  const surface = DUE_SURFACE[dueTone(ticket.dueDate)] || 'bg-surface'

  return (
    <article
      className={`flex cursor-pointer overflow-hidden rounded-xl border border-line shadow-sm transition hover:shadow-md ${surface} ${dragging ? 'opacity-60' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setDragging(false)}
      onClick={() => {
        if (skipClick.current) {
          skipClick.current = false
          return
        }
        if (onEdit) onEdit(ticket)
      }}
    >
      <span className={`w-1.5 shrink-0 ${accent}`} aria-hidden="true" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide uppercase ${badge}`}>
          {ticket.priority}
        </span>
        <span className="text-[0.7rem] tracking-wide text-muted uppercase" aria-hidden="true">Arrastrar</span>
        {onDelete && <Button
          variant="iconDanger"
          size="icon"
          aria-label="Eliminar ticket"
          onClick={async (event) => {
            event.stopPropagation()
            const confirmed = await confirmDialog({
              title: '¿Eliminar el ticket?',
              text: ticket.title || 'Sin título',
              confirmText: 'Eliminar',
            })
            if (confirmed) onDelete(ticket.id)
          }}
        >
          ×
        </Button>}
      </div>

      <h3 className="font-semibold text-ink">{ticket.title}</h3>

      {facts || expediente ? (
        <dl className="flex flex-col gap-1 text-sm">
          {expediente && (
            <div>
              <dt className="text-[0.7rem] tracking-wide text-muted uppercase">N° expediente</dt>
              <dd className="text-muted">{expediente}</dd>
            </div>
          )}
          {facts?.juzgado && (
            <div>
              <dt className="text-[0.7rem] tracking-wide text-muted uppercase">Juzgado</dt>
              <dd className="text-muted">{facts.juzgado}</dd>
            </div>
          )}
          {facts?.novedad && (
            <div>
              <dt className="text-[0.7rem] tracking-wide text-muted uppercase">Novedad</dt>
              <dd className="line-clamp-3 text-muted">{facts.novedad}</dd>
            </div>
          )}
        </dl>
      ) : (
        ticket.description && <p className="line-clamp-3 text-sm text-muted">{ticket.description}</p>
      )}

      {visibleLabels(ticket.labels).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {visibleLabels(ticket.labels).map((label) => (
            <span key={label} className="rounded-full bg-sunken px-2 py-0.5 text-[0.7rem] text-muted">{label}</span>
          ))}
        </div>
      )}

      <dl className="flex flex-col gap-1 text-sm">
        {ticket.clientName && (
          <div>
            <dt className="text-[0.7rem] tracking-wide text-muted uppercase">Cliente</dt>
            <dd className="text-muted">{ticket.clientName}</dd>
          </div>
        )}
        <div>
          <dt className="text-[0.7rem] tracking-wide text-muted uppercase">Asignado</dt>
          <dd className="text-muted">{assignees.join(', ') || 'Sin asignar'}</dd>
        </div>
        {followers.length > 0 && (
          <div>
            <dt className="text-[0.7rem] tracking-wide text-muted uppercase">Sigue</dt>
            <dd className="text-muted">{followers.join(', ')}</dd>
          </div>
        )}
        {ticket.dueDate && (
          <div>
            <dt className="text-[0.7rem] tracking-wide text-muted uppercase">Vence</dt>
            <dd className="text-muted">{formatDue(ticket.dueDate)}</dd>
          </div>
        )}
      </dl>

      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>{historyLabel}</span>
        {puedeMail && <Button variant="secondary" size="sm" onClick={handleTestMail} disabled={busy}>
          {busy ? 'Enviando…' : 'Probar mail'}
        </Button>}
      </div>
      {notice && <p className="text-xs text-muted">{notice}</p>}
      </div>
    </article>
  )
}

export default TicketCard

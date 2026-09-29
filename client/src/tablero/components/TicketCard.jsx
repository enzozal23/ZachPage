import { useRef, useState } from 'react'
import { testDueReminderRequest } from '../../api/kanban.js'
import { ticketAssignees, ticketFollowers } from '../lib/assignees.js'
import { visibleLabels } from '../lib/persist.js'

const PRIORITY_CLASS = {
  Alta: 'priority-alta',
  Media: 'priority-media',
  Baja: 'priority-baja',
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
  return { juzgado, novedad: novedad.join(' ') }
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
  const skipClick = useRef(false)
  const comments = ticket.comments?.length || 0
  const facts = readCaseFacts(ticket.description)
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

  return (
    <article
      className={`ticket-card tone-${ticket.priority || 'Media'} ${dragging ? 'is-dragging' : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setDragging(false)}
      onClick={() => {
        if (skipClick.current) {
          skipClick.current = false
          return
        }
        onEdit(ticket)
      }}
    >
      <div className="ticket-card-header">
        <span className={`priority-badge ${PRIORITY_CLASS[ticket.priority] || ''}`}>
          {ticket.priority}
        </span>
        <span className="ticket-drag-hint" aria-hidden="true">Arrastrar</span>
        <button
          type="button"
          className="ticket-delete"
          aria-label="Eliminar ticket"
          onClick={(event) => {
            event.stopPropagation()
            if (window.confirm(`¿Eliminar el ticket "${ticket.title}"?`)) {
              onDelete(ticket.id)
            }
          }}
        >
          ×
        </button>
      </div>

      <h3 className="ticket-title">{ticket.title}</h3>

      {facts ? (
        <dl className="ticket-facts">
          {facts.juzgado && (
            <div className="ticket-fact">
              <dt>Juzgado</dt>
              <dd>{facts.juzgado}</dd>
            </div>
          )}
          {facts.novedad && (
            <div className="ticket-fact">
              <dt>Novedad</dt>
              <dd>{facts.novedad}</dd>
            </div>
          )}
        </dl>
      ) : (
        ticket.description && <p className="ticket-description">{ticket.description}</p>
      )}

      {visibleLabels(ticket.labels).length > 0 && (
        <div className="ticket-labels">
          {visibleLabels(ticket.labels).map((label) => (
            <span key={label} className="ticket-label">{label}</span>
          ))}
        </div>
      )}

      <dl className="ticket-facts">
        <div className="ticket-fact">
          <dt>Asignado</dt>
          <dd>{assignees.join(', ') || 'Sin asignar'}</dd>
        </div>
        {followers.length > 0 && (
          <div className="ticket-fact">
            <dt>Sigue</dt>
            <dd>{followers.join(', ')}</dd>
          </div>
        )}
        {ticket.dueDate && (
          <div className="ticket-fact">
            <dt>Vence</dt>
            <dd>{formatDue(ticket.dueDate)}</dd>
          </div>
        )}
      </dl>

      <div className="ticket-card-actions">
        <span>{historyLabel}</span>
        <button type="button" className="ticket-test-mail" onClick={handleTestMail} disabled={busy}>
          {busy ? 'Enviando…' : 'Probar mail'}
        </button>
      </div>
      {notice && <p className="ticket-test-notice">{notice}</p>}
    </article>
  )
}

export default TicketCard

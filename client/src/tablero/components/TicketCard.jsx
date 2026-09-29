import { useState } from 'react'
import { testDueReminderRequest } from '../../api/kanban.js'

const PRIORITY_CLASS = {
  Alta: 'priority-alta',
  Media: 'priority-media',
  Baja: 'priority-baja',
}

function TicketCard({ ticket, onEdit, onDelete }) {
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

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

  return (
    <div className="ticket-card" onClick={() => onEdit(ticket)}>
      <div className="ticket-card-header">
        <span className={`priority-badge ${PRIORITY_CLASS[ticket.priority] || ''}`}>
          {ticket.priority}
        </span>
        <button
          type="button"
          className="ticket-delete"
          aria-label="Eliminar ticket"
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm(`¿Eliminar el ticket "${ticket.title}"?`)) {
              onDelete(ticket.id)
            }
          }}
        >
          ×
        </button>
      </div>

      <p className="ticket-title">{ticket.title}</p>

      {ticket.description && <p className="ticket-description">{ticket.description}</p>}

      {ticket.task && <p className="ticket-task">Tarea: {ticket.task}</p>}

      {ticket.labels?.length > 0 && (
        <div className="ticket-labels">
          {ticket.labels.map((label) => (
            <span key={label} className="ticket-label">
              {label}
            </span>
          ))}
        </div>
      )}

      <div className="ticket-footer">
        <span>{ticket.assignee || 'Sin asignar'}</span>
        {ticket.dueDate && <span>{ticket.dueDate}</span>}
      </div>

      <button type="button" className="ticket-test-mail" onClick={handleTestMail} disabled={busy}>
        {busy ? 'Enviando…' : 'Probar mail'}
      </button>
      {notice && <p className="ticket-test-notice">{notice}</p>}
    </div>
  )
}

export default TicketCard

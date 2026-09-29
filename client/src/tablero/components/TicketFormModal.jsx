import { useState } from 'react'
import { COLUMNS, PRIORITIES, DEFAULT_PRIORITY } from '../constants/columns.js'

function buildInitialForm(ticket, initialStatus) {
  if (ticket) {
    return {
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
      assignee: ticket.assignee || '',
      priority: ticket.priority || DEFAULT_PRIORITY,
      labels: (ticket.labels || []).join(', '),
      dueDate: ticket.dueDate || '',
      task: ticket.task || '',
    }
  }
  return {
    title: '',
    description: '',
    status: initialStatus || COLUMNS[0].id,
    assignee: '',
    priority: DEFAULT_PRIORITY,
    labels: '',
    dueDate: '',
    task: '',
  }
}

function TicketFormModal({ mode, ticket, initialStatus, onClose, onSave }) {
  const [form, setForm] = useState(() => buildInitialForm(ticket, initialStatus))
  const [error, setError] = useState(null)

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const title = form.title.trim()
    if (!title) {
      setError('El título es obligatorio.')
      return
    }
    onSave({
      title,
      description: form.description,
      status: form.status,
      assignee: form.assignee,
      priority: form.priority,
      labels: form.labels
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
      dueDate: form.dueDate,
      task: form.task,
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{mode === 'edit' ? 'Editar ticket' : 'Nuevo ticket'}</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Título *
            <input
              autoFocus
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </label>

          <label>
            Descripción
            <textarea
              rows={8}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </label>

          <div className="form-row">
            <label>
              Estado
              <select value={form.status} onChange={(e) => handleChange('status', e.target.value)}>
                {COLUMNS.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Prioridad
              <select value={form.priority} onChange={(e) => handleChange('priority', e.target.value)}>
                {PRIORITIES.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label>
              Responsable
              <input
                type="text"
                value={form.assignee}
                onChange={(e) => handleChange('assignee', e.target.value)}
              />
            </label>

            <label>
              Fecha límite
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />
            </label>
          </div>

          <label>
            Tarea
            <input
              type="text"
              value={form.task}
              onChange={(e) => handleChange('task', e.target.value)}
            />
          </label>

          <label>
            Etiquetas (separadas por coma)
            <input
              type="text"
              value={form.labels}
              onChange={(e) => handleChange('labels', e.target.value)}
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TicketFormModal

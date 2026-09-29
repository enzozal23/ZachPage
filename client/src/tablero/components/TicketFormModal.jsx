import { useState } from 'react'
import { COLUMNS, PRIORITIES, DEFAULT_PRIORITY } from '../constants/columns.js'
import AssigneeSelect from './AssigneeSelect.jsx'
import { assigneeFields, ticketAssignees, ticketFollowers } from '../lib/assignees.js'
import { visibleLabels } from '../lib/persist.js'
import { ticketTasks } from '../lib/tasks.js'

function buildInitialForm(ticket, initialStatus) {
  if (ticket) {
    return {
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status,
      assignees: ticketAssignees(ticket),
      followers: ticketFollowers(ticket),
      priority: ticket.priority || DEFAULT_PRIORITY,
      labels: visibleLabels(ticket.labels).join(', '),
      dueDate: ticket.dueDate || '',
    }
  }
  return {
    title: '',
    description: '',
    status: initialStatus || COLUMNS[0].id,
    assignees: [],
    followers: [],
    priority: DEFAULT_PRIORITY,
    labels: '',
    dueDate: '',
  }
}

function formatWhen(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-AR')
}

function TicketFormModal({
  mode,
  ticket,
  initialStatus,
  onClose,
  onSave,
  onAddComment,
  onAddTask,
  onToggleTask,
}) {
  const [form, setForm] = useState(() => buildInitialForm(ticket, initialStatus))
  const [error, setError] = useState(null)
  const [comment, setComment] = useState('')
  const [draftTasks, setDraftTasks] = useState([])
  const [taskDraft, setTaskDraft] = useState('')
  const comments = ticket?.comments || []
  const tasks = ticket ? ticketTasks(ticket) : draftTasks
  const tasksDone = tasks.filter((task) => task.done).length

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
      ...assigneeFields(form.assignees),
      followers: form.followers,
      priority: form.priority,
      labels: form.labels
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean),
      dueDate: form.dueDate,
      ...(ticket ? {} : { tasks: draftTasks }),
    })
  }

  function addTask(text) {
    const trimmed = text.trim()
    if (!trimmed) return
    if (ticket) onAddTask(ticket.id, trimmed)
    else setDraftTasks((prev) => [...prev, { id: crypto.randomUUID(), text: trimmed, done: false }])
  }

  function toggleTask(taskId) {
    if (ticket) onToggleTask(ticket.id, taskId)
    else setDraftTasks((prev) => prev.map((task) => (
      task.id === taskId ? { ...task, done: !task.done } : task
    )))
  }

  function handleComment() {
    const text = comment.trim()
    if (!text || !ticket) return
    onAddComment(ticket.id, text)
    setComment('')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form className="modal ticket-sheet" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className="sheet-top">
          <div className="sheet-heading">
            <p className="sheet-kicker">{mode === 'edit' ? 'Ficha' : 'Nueva ficha'}</p>
            <input
              className="sheet-title"
              autoFocus
              type="text"
              value={form.title}
              placeholder="Carátula o título"
              onChange={(e) => handleChange('title', e.target.value)}
            />
            {error && <p className="form-error">{error}</p>}
          </div>
          <div className="sheet-top-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cerrar</button>
            <button type="submit">Guardar</button>
          </div>
        </header>

        <div className="sheet-body">
          <section className="sheet-main">
            <div className="sheet-pills" role="group" aria-label="Estado">
              {COLUMNS.map((column) => (
                <button
                  key={column.id}
                  type="button"
                  className={form.status === column.id ? 'sheet-pill is-on' : 'sheet-pill'}
                  onClick={() => handleChange('status', column.id)}
                >
                  {column.label}
                </button>
              ))}
            </div>
            <div className="sheet-pills" role="group" aria-label="Prioridad">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={`sheet-pill tone-${priority} ${form.priority === priority ? 'is-on' : ''}`}
                  onClick={() => handleChange('priority', priority)}
                >
                  {priority}
                </button>
              ))}
            </div>

            <label className="sheet-document">
              <span>Descripción</span>
              <textarea
                value={form.description}
                placeholder="Hechos, juzgado, vencimientos, intimaciones…"
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </label>

            <label>
              <span>Etiquetas</span>
              <input
                type="text"
                value={form.labels}
                placeholder="Separadas por coma"
                onChange={(e) => handleChange('labels', e.target.value)}
              />
            </label>
          </section>

          <aside className="sheet-side">
            <label>
              <span>Fecha límite</span>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />
            </label>
            <label>
              <span>Responsables</span>
              <AssigneeSelect
                value={form.assignees}
                emptyLabel="Buscar responsable"
                onChange={(assignees) => handleChange('assignees', assignees)}
              />
            </label>
            <label>
              <span>Seguidores</span>
              <AssigneeSelect
                value={form.followers}
                emptyLabel="Buscar seguidor"
                onChange={(followers) => handleChange('followers', followers)}
              />
            </label>

            <details className="ticket-tasks">
              <summary>
                {tasks.length === 0 ? 'Tareas' : `${tasksDone} de ${tasks.length}`}
              </summary>
              <ul>
                {tasks.map((task) => (
                  <li key={task.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                      />
                      <span className={task.done ? 'is-done' : ''}>{task.text}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="ticket-tasks-add">
                <input
                  type="text"
                  placeholder="Nueva tarea"
                  value={taskDraft}
                  onChange={(event) => setTaskDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    addTask(taskDraft)
                    setTaskDraft('')
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    addTask(taskDraft)
                    setTaskDraft('')
                  }}
                >
                  Agregar
                </button>
              </div>
            </details>

            {mode === 'edit' && (
              <div className="sheet-history">
                <h3>Historial</h3>
                <ul>
                  {comments.length === 0 && <li className="sheet-history-empty">Todavía no hay nada en el historial.</li>}
                  {comments.map((item) => (
                    <li key={item.id}>
                      <div className="sheet-history-meta">
                        <strong>{item.author || 'Usuario'}</strong>
                        <time>{formatWhen(item.createdAt)}</time>
                      </div>
                      <p>{item.text}</p>
                    </li>
                  ))}
                </ul>
                <div className="sheet-history-compose">
                  <textarea
                    rows={3}
                    placeholder="Escribí en el historial"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                  <button type="button" onClick={handleComment} disabled={!comment.trim()}>
                    Agregar
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </form>
    </div>
  )
}

export default TicketFormModal

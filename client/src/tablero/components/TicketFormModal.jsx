import { useState } from 'react'
import { COLUMNS, PRIORITIES, DEFAULT_PRIORITY, ticketColumnId } from '../constants/columns.js'
import AssigneeSelect from './AssigneeSelect.jsx'
import { Button } from './ui/Button.jsx'
import { controlClass } from './ui/styles.js'
import { assigneeFields, ticketAssignees, ticketFollowers } from '../lib/assignees.js'
import { resolveExpediente, visibleLabels } from '../lib/persist.js'
import { ticketTasks } from '../lib/tasks.js'
import { confirmDialog } from '../lib/dialog.js'

function buildInitialForm(ticket, initialStatus) {
  if (ticket) {
    return {
      title: ticket.title,
      description: ticket.description || '',
      status: ticketColumnId(ticket),
      assignees: ticketAssignees(ticket),
      followers: ticketFollowers(ticket),
      priority: ticket.priority || DEFAULT_PRIORITY,
      labels: visibleLabels(ticket.labels).join(', '),
      dueDate: ticket.dueDate || '',
      expediente: resolveExpediente(ticket),
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
    expediente: '',
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
  onDeleteComment,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  onPatch,
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
      expediente: form.expediente.trim(),
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

  async function deleteTask(task) {
    const confirmed = await confirmDialog({
      title: '¿Eliminar la tarea?',
      text: task.text,
      confirmText: 'Eliminar',
    })
    if (!confirmed) return
    if (ticket) onDeleteTask(ticket.id, task.id)
    else setDraftTasks((prev) => prev.filter((item) => item.id !== task.id))
  }

  function labelList() {
    return form.labels.split(',').map((label) => label.trim()).filter(Boolean)
  }

  function removeLabel(label) {
    const next = labelList().filter((item) => item !== label)
    handleChange('labels', next.join(', '))
    if (ticket) onPatch?.({ labels: next })
  }

  async function deleteComment(item) {
    const confirmed = await confirmDialog({
      title: '¿Eliminar esta entrada del historial?',
      text: item.text,
      confirmText: 'Eliminar',
    })
    if (!confirmed || !ticket) return
    onDeleteComment(ticket.id, item.id)
  }

  function handleComment() {
    const text = comment.trim()
    if (!text || !ticket) return
    onAddComment(ticket.id, text)
    setComment('')
  }

  const sideLabel = 'flex flex-col gap-1.5 text-sm font-medium text-muted'
  const priorityOn = {
    Alta: 'bg-red-600 text-white',
    Media: 'bg-amber-500 text-white',
    Baja: 'bg-emerald-600 text-white',
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/60" onClick={onClose}>
      <form className="flex h-[90dvh] w-[90vw] flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <header className="flex shrink-0 flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold tracking-wide text-chip-indigo-ink uppercase">{mode === 'edit' ? 'Ficha' : 'Nueva ficha'}</p>
            <input
              className="mt-1 w-full border-0 bg-transparent text-2xl font-semibold text-ink outline-none placeholder:text-muted"
              autoFocus
              type="text"
              value={form.title}
              placeholder="Carátula o título"
              onChange={(e) => handleChange('title', e.target.value)}
            />
            {error && <p className="text-sm text-chip-red-ink">{error}</p>}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
            <Button type="submit">Guardar</Button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.85fr)] lg:grid-rows-1">
          <section className="flex h-full min-h-0 flex-col gap-4">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Estado">
              {COLUMNS.map((column) => (
                <button
                  key={column.id}
                  type="button"
                  className={`rounded-full px-3 py-1 text-sm font-medium ${form.status === column.id ? 'bg-indigo-600 text-white' : 'bg-sunken text-muted'}`}
                  onClick={() => handleChange('status', column.id)}
                >
                  {column.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Prioridad">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority}
                  type="button"
                  className={`rounded-full px-3 py-1 text-sm font-medium ${form.priority === priority ? priorityOn[priority] : 'bg-sunken text-muted'}`}
                  onClick={() => handleChange('priority', priority)}
                >
                  {priority}
                </button>
              ))}
            </div>

            <label className={`${sideLabel} min-h-40 flex-1`}>
              <span>Descripción</span>
              <textarea
                className={`${controlClass} min-h-0 flex-1 resize-y`}
                value={form.description}
                placeholder="Hechos, juzgado, vencimientos, intimaciones…"
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </label>

            <label className={sideLabel}>
              <span>Etiquetas</span>
              {labelList().length > 0 && (
                <span className="flex flex-wrap gap-1.5">
                  {labelList().map((label) => (
                    <button
                      key={label}
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full bg-sunken px-2 py-0.5 text-xs text-ink"
                      onClick={() => removeLabel(label)}
                      aria-label={`Quitar etiqueta ${label}`}
                    >
                      {label}
                      <span aria-hidden="true">×</span>
                    </button>
                  ))}
                </span>
              )}
              <input
                className={controlClass}
                type="text"
                value={form.labels}
                placeholder="Separadas por coma"
                onChange={(e) => handleChange('labels', e.target.value)}
              />
            </label>
          </section>

          <aside className="flex h-full min-h-0 flex-col gap-4">
            <label className={sideLabel}>
              <span>N° expediente</span>
              <input
                className={controlClass}
                type="text"
                placeholder="Número de expediente"
                value={form.expediente}
                onChange={(e) => handleChange('expediente', e.target.value)}
              />
            </label>
            <label className={sideLabel}>
              <span>Fecha límite</span>
              <input
                className={controlClass}
                type="text"
                placeholder="dd/mm/aaaa"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
              />
            </label>
            <label className={sideLabel}>
              <span>Responsables</span>
              <AssigneeSelect
                value={form.assignees}
                emptyLabel="Buscar responsable"
                onChange={(assignees) => handleChange('assignees', assignees)}
              />
            </label>
            <label className={sideLabel}>
              <span>Seguidores</span>
              <AssigneeSelect
                value={form.followers}
                emptyLabel="Buscar seguidor"
                onChange={(followers) => handleChange('followers', followers)}
              />
            </label>

            <details className="rounded-xl border border-line p-3">
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-ink">
                <span>Tareas</span>
                <span className="text-xs font-medium text-muted">
                  {tasks.length === 0 ? 'Ninguna' : `${tasksDone} de ${tasks.length}`}
                </span>
              </summary>
              <ul className="mt-3 flex flex-col gap-2">
                {tasks.map((task) => (
                  <li key={task.id}>
                    <div className="flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={task.done}
                        aria-label={`Marcar tarea ${task.text}`}
                        onChange={() => toggleTask(task.id)}
                      />
                      <span className={`min-w-0 flex-1 ${task.done ? 'text-muted line-through' : 'text-ink'}`}>{task.text}</span>
                      <button
                        type="button"
                        className="text-muted hover:text-chip-red-ink"
                        aria-label={`Eliminar tarea ${task.text}`}
                        onClick={() => deleteTask(task)}
                      >
                        ×
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <input
                  className={controlClass}
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
                <Button
                  variant="secondary"
                  onClick={() => {
                    addTask(taskDraft)
                    setTaskDraft('')
                  }}
                >
                  Agregar
                </Button>
              </div>
            </details>

            {mode === 'edit' && (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <h3 className="text-sm font-semibold text-ink">Historial</h3>
                <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
                  {comments.length === 0 && <li className="text-sm text-muted">Todavía no hay nada en el historial.</li>}
                  {comments.map((item) => (
                    <li key={item.id} className="rounded-lg bg-sunken p-3 text-sm">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted">
                        <strong className="text-muted">{item.author || 'Usuario'}</strong>
                        <span className="flex items-center gap-2">
                          <time>{formatWhen(item.createdAt)}</time>
                          <button
                            type="button"
                            className="text-muted hover:text-chip-red-ink"
                            aria-label="Eliminar entrada del historial"
                            onClick={() => deleteComment(item)}
                          >
                            ×
                          </button>
                        </span>
                      </div>
                      <p className="mt-1 text-ink">{item.text}</p>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col gap-2">
                  <textarea
                    className={`${controlClass} resize-y`}
                    rows={3}
                    placeholder="Escribí en el historial"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                  />
                  <Button onClick={handleComment} disabled={!comment.trim()}>
                    Agregar
                  </Button>
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

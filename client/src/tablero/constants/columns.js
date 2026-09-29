import { ticketAssignees } from '../lib/assignees.js'

export const PENDING_COLUMN_ID = 'pending_estimate'

export const COLUMNS = [
  { id: PENDING_COLUMN_ID, label: 'Pendiente estimación/asignación' },
  { id: 'todo', label: 'Por hacer' },
  { id: 'in_progress', label: 'En progreso' },
  { id: 'review', label: 'En revisión' },
  { id: 'done', label: 'Hecho' },
]

export const DEFAULT_COLUMN_ID = PENDING_COLUMN_ID

export const PRIORITIES = ['Alta', 'Media', 'Baja']

export const DEFAULT_PRIORITY = 'Media'

export function needsAssignment(ticket) {
  const noAssignees = ticketAssignees(ticket).length === 0
  const noDue = !String(ticket?.dueDate || '').trim()
  return noAssignees && noDue
}

/** Columna visible: sin responsable ni vencimiento → pendiente. */
export function ticketColumnId(ticket) {
  if (needsAssignment(ticket)) return PENDING_COLUMN_ID
  const status = ticket?.status || 'todo'
  if (status === PENDING_COLUMN_ID) return 'todo'
  return status
}

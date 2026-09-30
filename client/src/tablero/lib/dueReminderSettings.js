export const REMINDER_STATUSES = [
  { id: 'pending_estimate', label: 'Pendiente estimación/asignación', color: '#974f00', bg: '#fff0b3' },
  { id: 'todo', label: 'Por hacer', color: '#3c2678', bg: '#ddd6f5' },
  { id: 'in_progress', label: 'En progreso', color: '#0052cc', bg: '#deebff' },
  { id: 'review', label: 'En revisión', color: '#403294', bg: '#eae6ff' },
]

export const REMINDER_PRIORITIES = [
  { id: 'Alta', color: '#bf2600', bg: '#ffebe6' },
  { id: 'Media', color: '#974f00', bg: '#fff0b3' },
  { id: 'Baja', color: '#006644', bg: '#e3fcef' },
]

export const DEFAULT_DAYS_BEFORE = 1

export function normalizeDueReminderRules(input) {
  const incoming = Array.isArray(input) ? input : []
  const byKey = new Map()
  for (const item of incoming) {
    const status = String(item?.status || '').trim()
    const priority = String(item?.priority || '').trim()
    if (!REMINDER_STATUSES.some((entry) => entry.id === status)) continue
    if (!REMINDER_PRIORITIES.some((entry) => entry.id === priority)) continue
    const days = Number(item?.daysBefore)
    byKey.set(`${status}::${priority}`, {
      status,
      priority,
      daysBefore: Number.isFinite(days) ? Math.max(0, Math.min(365, Math.round(days))) : DEFAULT_DAYS_BEFORE,
    })
  }
  return [...byKey.values()]
}

export function statusMeta(statusId) {
  return REMINDER_STATUSES.find((entry) => entry.id === statusId) || null
}

export function priorityMeta(priorityId) {
  return REMINDER_PRIORITIES.find((entry) => entry.id === priorityId) || null
}

export function statusLabel(statusId) {
  return statusMeta(statusId)?.label || statusId
}

export function publicSettings(settings) {
  return {
    mailNotificationsEnabled: settings?.mailNotificationsEnabled !== false,
    dueReminders: normalizeDueReminderRules(settings?.dueReminders),
  }
}

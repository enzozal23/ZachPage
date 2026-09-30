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

export function publicSettings(settings) {
  return {
    mailNotificationsEnabled: settings?.mailNotificationsEnabled !== false,
    dueReminders: normalizeDueReminderRules(settings?.dueReminders),
  }
}

export function daysBeforeForTicket(ticket, rules) {
  const list = normalizeDueReminderRules(rules)
  // Sin reglas: 1 día de anticipación para todas las tarjetas.
  if (!list.length) return DEFAULT_DAYS_BEFORE

  const status = String(ticket?.status || 'todo')
  const priority = String(ticket?.priority || 'Media')
  const match = list.find((rule) => rule.status === status && rule.priority === priority)
  // Con reglas: solo se notifica si hay coincidencia exacta de estado + prioridad.
  return match ? match.daysBefore : null
}

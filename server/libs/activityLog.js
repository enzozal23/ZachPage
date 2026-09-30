import ActivityLog from '../models/activity.model.js'

function sameList(a, b) {
  const left = JSON.stringify([...(a || [])].map(String).sort())
  const right = JSON.stringify([...(b || [])].map(String).sort())
  return left === right
}

function sameTasks(a, b) {
  const norm = (list) => (list || []).map((task) => ({
    id: String(task.id || ''),
    text: String(task.text || ''),
    done: Boolean(task.done),
  }))
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b))
}

function sameComments(a, b) {
  const norm = (list) => (list || []).map((comment) => ({
    id: String(comment.id || ''),
    text: String(comment.text || ''),
    author: String(comment.author || ''),
  }))
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b))
}

export function requestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  if (forwarded) return forwarded
  return req.ip || req.socket?.remoteAddress || ''
}

export function ticketChanges(before, after) {
  const changes = []
  if ((before.title || '') !== (after.title || '')) changes.push('título')
  if ((before.description || '') !== (after.description || '')) changes.push('descripción')
  if ((before.status || '') !== (after.status || '')) changes.push(`estado → ${after.status || ''}`)
  if ((before.priority || '') !== (after.priority || '')) changes.push(`prioridad → ${after.priority || ''}`)
  if ((before.dueDate || '') !== (after.dueDate || '')) changes.push('fecha de vencimiento')
  if (!sameList(before.assignees, after.assignees) || (before.assignee || '') !== (after.assignee || '')) {
    changes.push('responsables')
  }
  if (!sameList(before.followers, after.followers)) changes.push('seguidores')
  if (!sameList(before.labels, after.labels)) changes.push('etiquetas')
  if (!sameTasks(before.tasks, after.tasks) || (before.task || '') !== (after.task || '')) {
    changes.push('tareas')
  }
  if (!sameComments(before.comments, after.comments)) changes.push('historial')
  if ((before.boardId || '') !== (after.boardId || '')) changes.push('tablero')
  return changes
}

export async function writeActivity(entry) {
  try {
    await ActivityLog.create(entry)
  } catch (error) {
    console.error('[activity] no se pudo guardar', error.message)
  }
}

export async function writeActivities(entries) {
  if (!entries?.length) return
  try {
    await ActivityLog.insertMany(entries, { ordered: false })
  } catch (error) {
    console.error('[activity] no se pudo guardar el lote', error.message)
  }
}

export function buildTicketActivities({ previousTickets, nextTickets, actor, ip }) {
  const prev = new Map((previousTickets || []).map((ticket) => [ticket.id, ticket]))
  const next = new Map((nextTickets || []).map((ticket) => [ticket.id, ticket]))
  const entries = []

  for (const [id, ticket] of next) {
    const old = prev.get(id)
    if (!old) {
      entries.push({
        action: 'create',
        entity: 'ticket',
        ticketId: id,
        ticketTitle: ticket.title || '',
        summary: `Alta de tarjeta: ${ticket.title || id}`,
        userId: actor.userId || '',
        username: actor.username || '',
        email: actor.email || '',
        ip,
        detail: {
          status: ticket.status,
          assignees: ticket.assignees,
          dueDate: ticket.dueDate,
          source: ticket.source,
        },
      })
      continue
    }
    const changes = ticketChanges(old, ticket)
    if (!changes.length) continue
    entries.push({
      action: 'update',
      entity: 'ticket',
      ticketId: id,
      ticketTitle: ticket.title || old.title || '',
      summary: `Actualización de tarjeta: ${changes.join(', ')}`,
      userId: actor.userId || '',
      username: actor.username || '',
      email: actor.email || '',
      ip,
      detail: { changes, before: summarizeTicket(old), after: summarizeTicket(ticket) },
    })
  }

  for (const [id, ticket] of prev) {
    if (next.has(id)) continue
    entries.push({
      action: 'delete',
      entity: 'ticket',
      ticketId: id,
      ticketTitle: ticket.title || '',
      summary: `Eliminación de tarjeta: ${ticket.title || id}`,
      userId: actor.userId || '',
      username: actor.username || '',
      email: actor.email || '',
      ip,
      detail: { status: ticket.status },
    })
  }

  return entries
}

function summarizeTicket(ticket) {
  return {
    title: ticket.title || '',
    status: ticket.status || '',
    priority: ticket.priority || '',
    dueDate: ticket.dueDate || '',
    assignees: ticket.assignees || [],
    followers: ticket.followers || [],
    tasks: (ticket.tasks || []).map((task) => ({ text: task.text, done: task.done })),
    commentsCount: (ticket.comments || []).length,
  }
}

export function buildImportActivities({ previousImports, nextImports, actor, ip }) {
  const prev = new Map((previousImports || []).map((item) => [item.id, item]))
  const next = new Map((nextImports || []).map((item) => [item.id, item]))
  const entries = []

  for (const [id, item] of next) {
    if (prev.has(id)) continue
    entries.push({
      action: 'create',
      entity: 'import',
      ticketId: '',
      ticketTitle: item.fileName || '',
      summary: `Importación Word: ${item.fileName || id} (${item.imported || 0} tickets)`,
      userId: actor.userId || '',
      username: actor.username || actor.email || item.author || '',
      email: actor.email || '',
      ip,
      detail: item,
    })
  }

  for (const [id, item] of prev) {
    if (next.has(id)) continue
    entries.push({
      action: 'delete',
      entity: 'import',
      ticketId: '',
      ticketTitle: item.fileName || '',
      summary: `Eliminación de importación: ${item.fileName || id}`,
      userId: actor.userId || '',
      username: actor.username || '',
      email: actor.email || '',
      ip,
      detail: item,
    })
  }

  return entries
}

function statusLabel(statusId) {
  const labels = {
    pending_estimate: 'Pendiente estimación/asignación',
    todo: 'Por hacer',
    in_progress: 'En progreso',
    review: 'En revisión',
  }
  return labels[statusId] || statusId
}

function ruleKey(rule) {
  return `${rule.status}::${rule.priority}`
}

function actorFields(actor, ip) {
  return {
    userId: actor.userId || '',
    username: actor.username || '',
    email: actor.email || '',
    ip,
  }
}

export function buildSettingsActivities({ previousSettings, nextSettings, actor, ip }) {
  const before = previousSettings || { mailNotificationsEnabled: true, dueReminders: [] }
  const after = nextSettings || { mailNotificationsEnabled: true, dueReminders: [] }
  const entries = []
  const base = actorFields(actor, ip)

  if (Boolean(before.mailNotificationsEnabled) !== Boolean(after.mailNotificationsEnabled)) {
    entries.push({
      action: 'update',
      entity: 'settings',
      ticketId: '',
      ticketTitle: 'Notificaciones por mail',
      summary: after.mailNotificationsEnabled
        ? 'Configuración: notificaciones por mail activadas'
        : 'Configuración: notificaciones por mail desactivadas',
      ...base,
      detail: {
        field: 'mailNotificationsEnabled',
        before: before.mailNotificationsEnabled,
        after: after.mailNotificationsEnabled,
      },
    })
  }

  const prevRules = new Map((before.dueReminders || []).map((rule) => [ruleKey(rule), rule]))
  const nextRules = new Map((after.dueReminders || []).map((rule) => [ruleKey(rule), rule]))

  for (const [key, rule] of nextRules) {
    const old = prevRules.get(key)
    const label = `${statusLabel(rule.status)} / ${rule.priority}`
    if (!old) {
      entries.push({
        action: 'create',
        entity: 'settings',
        ticketId: '',
        ticketTitle: label,
        summary: `Configuración: alta de aviso (${label}, ${rule.daysBefore} días)`,
        ...base,
        detail: { field: 'dueReminder', rule },
      })
      continue
    }
    if (Number(old.daysBefore) !== Number(rule.daysBefore)) {
      entries.push({
        action: 'update',
        entity: 'settings',
        ticketId: '',
        ticketTitle: label,
        summary: `Configuración: aviso actualizado (${label}, ${old.daysBefore} → ${rule.daysBefore} días)`,
        ...base,
        detail: { field: 'dueReminder', before: old, after: rule },
      })
    }
  }

  for (const [key, rule] of prevRules) {
    if (nextRules.has(key)) continue
    const label = `${statusLabel(rule.status)} / ${rule.priority}`
    entries.push({
      action: 'delete',
      entity: 'settings',
      ticketId: '',
      ticketTitle: label,
      summary: `Configuración: baja de aviso (${label})`,
      ...base,
      detail: { field: 'dueReminder', rule },
    })
  }

  return entries
}

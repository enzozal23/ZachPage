import ActivityLog from '../models/activity.model.js'

export function requestIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  if (forwarded) return forwarded
  return req.ip || req.socket?.remoteAddress || ''
}

function clip(value, max = 90) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  if (!text) return 'vacío'
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function quote(value) {
  return `«${clip(value)}»`
}

function names(list) {
  return [...new Set((Array.isArray(list) ? list : String(list || '').split(','))
    .map((item) => String(item || '').trim())
    .filter(Boolean))]
}

function listDiff(before, after) {
  const prev = new Set(names(before))
  const next = new Set(names(after))
  return {
    added: [...next].filter((item) => !prev.has(item)),
    removed: [...prev].filter((item) => !next.has(item)),
  }
}

function byId(list, keyOf) {
  const map = new Map()
  for (const item of list || []) {
    const id = keyOf ? keyOf(item) : String(item?.id || '').trim()
    if (id) map.set(id, item)
  }
  return map
}

function commentKey(comment) {
  const id = String(comment?.id || '').trim()
  if (id) return id
  return `${comment?.createdAt || ''}|${comment?.author || ''}|${comment?.text || ''}`
}

export function ticketChanges(before, after) {
  const changes = []
  const push = (action, summary, detail) => changes.push({ action, summary, detail })

  if ((before.title || '') !== (after.title || '')) {
    push('update', `Actualizó el título: ${quote(before.title)} → ${quote(after.title)}`, {
      field: 'title',
      before: before.title || '',
      after: after.title || '',
    })
  }
  if ((before.description || '') !== (after.description || '')) {
    push('update', `Actualizó la descripción: ${quote(after.description)}`, {
      field: 'description',
      before: before.description || '',
      after: after.description || '',
    })
  }
  if ((before.status || '') !== (after.status || '')) {
    push('update', `Actualizó el estado: ${statusLabel(before.status)} → ${statusLabel(after.status)}`, {
      field: 'status',
      before: before.status || '',
      after: after.status || '',
    })
  }
  if ((before.priority || '') !== (after.priority || '')) {
    push('update', `Actualizó la prioridad: ${quote(before.priority)} → ${quote(after.priority)}`, {
      field: 'priority',
      before: before.priority || '',
      after: after.priority || '',
    })
  }
  if ((before.dueDate || '') !== (after.dueDate || '')) {
    push('update', `Actualizó la fecha límite: ${quote(before.dueDate)} → ${quote(after.dueDate)}`, {
      field: 'dueDate',
      before: before.dueDate || '',
      after: after.dueDate || '',
    })
  }
  if ((before.expediente || '') !== (after.expediente || '')) {
    push('update', `Actualizó el N° de expediente: ${quote(before.expediente)} → ${quote(after.expediente)}`, {
      field: 'expediente',
      before: before.expediente || '',
      after: after.expediente || '',
    })
  }
  if ((before.boardId || '') !== (after.boardId || '')) {
    push('update', 'Movió la tarjeta de tablero', {
      field: 'boardId',
      before: before.boardId || '',
      after: after.boardId || '',
    })
  }

  const people = [
    ['responsable', names(before.assignees?.length ? before.assignees : before.assignee), names(after.assignees?.length ? after.assignees : after.assignee)],
    ['seguidor', names(before.followers), names(after.followers)],
    ['etiqueta', names(before.labels), names(after.labels)],
  ]
  for (const [noun, prev, next] of people) {
    const { added, removed } = listDiff(prev, next)
    for (const item of added) {
      push('create', `Agregó ${noun === 'etiqueta' ? 'la etiqueta' : `el ${noun}`} ${quote(item)}`, { field: noun, added: item })
    }
    for (const item of removed) {
      push('delete', `Eliminó ${noun === 'etiqueta' ? 'la etiqueta' : `el ${noun}`} ${quote(item)}`, { field: noun, removed: item })
    }
  }

  const beforeTasks = byId(before.tasks)
  const afterTasks = byId(after.tasks)
  for (const [id, task] of afterTasks) {
    const old = beforeTasks.get(id)
    if (!old) {
      push('create', `Agregó la tarea ${quote(task.text)}`, { field: 'tasks', added: task.text || '' })
      continue
    }
    if (String(old.text || '') !== String(task.text || '')) {
      push('update', `Actualizó la tarea: ${quote(old.text)} → ${quote(task.text)}`, {
        field: 'tasks',
        before: old.text || '',
        after: task.text || '',
      })
    }
    if (Boolean(old.done) !== Boolean(task.done)) {
      push('update', `${task.done ? 'Marcó como hecha' : 'Marcó como pendiente'} la tarea ${quote(task.text)}`, {
        field: 'tasks',
        id,
        done: Boolean(task.done),
      })
    }
  }
  for (const [id, task] of beforeTasks) {
    if (afterTasks.has(id)) continue
    push('delete', `Eliminó la tarea ${quote(task.text)}`, { field: 'tasks', removed: task.text || '' })
  }

  const beforeComments = byId(before.comments, commentKey)
  const afterComments = byId(after.comments, commentKey)
  for (const [id, comment] of afterComments) {
    const old = beforeComments.get(id)
    if (!old) {
      push('create', `Agregó al historial: ${quote(comment.text)}`, { field: 'comments', added: comment.text || '' })
      continue
    }
    if (String(old.text || '') !== String(comment.text || '')) {
      push('update', `Actualizó el historial: ${quote(old.text)} → ${quote(comment.text)}`, {
        field: 'comments',
        before: old.text || '',
        after: comment.text || '',
      })
    }
  }
  for (const [id, comment] of beforeComments) {
    if (afterComments.has(id)) continue
    push('delete', `Eliminó del historial: ${quote(comment.text)}`, { field: 'comments', removed: comment.text || '' })
  }

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
        summary: `Agregó la tarjeta ${quote(ticket.title || id)}`,
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
    for (const change of ticketChanges(old, ticket)) {
      entries.push({
        action: change.action,
        entity: 'ticket',
        ticketId: id,
        ticketTitle: ticket.title || old.title || '',
        summary: change.summary,
        userId: actor.userId || '',
        username: actor.username || '',
        email: actor.email || '',
        ip,
        detail: change.detail,
      })
    }
  }

  for (const [id, ticket] of prev) {
    if (next.has(id)) continue
    entries.push({
      action: 'delete',
      entity: 'ticket',
      ticketId: id,
      ticketTitle: ticket.title || '',
      summary: `Eliminó la tarjeta ${quote(ticket.title || id)}`,
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
    expediente: ticket.expediente || '',
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
    done: 'Hecho',
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

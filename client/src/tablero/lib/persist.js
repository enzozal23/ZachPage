import { ticketTasks } from './tasks.js'

const MARK = '__lexora:'

export function visibleLabels(labels) {
  return (Array.isArray(labels) ? labels : []).filter((label) => !String(label).startsWith(MARK))
}

function readCarrier(labels) {
  const list = Array.isArray(labels) ? labels.map((label) => String(label)) : []
  const carrier = list.find((label) => label.startsWith(MARK))
  if (!carrier) return null
  try {
    return JSON.parse(decodeURIComponent(carrier.slice(MARK.length)))
  } catch {
    return null
  }
}

function preferList(serverList, extraList) {
  if (Array.isArray(serverList) && serverList.length) return serverList
  if (Array.isArray(extraList) && extraList.length) return extraList
  if (Array.isArray(serverList)) return serverList
  return undefined
}

/** Recupera N° expediente del campo, del carrier o del texto importado. */
export function resolveExpediente(ticket, extra = null) {
  const direct = String(ticket?.expediente || extra?.expediente || '').trim()
  if (direct) return direct

  const description = String(ticket?.description || '')
  const fromDescription = description.match(/^Expediente:\s*(.+)$/im)
  if (fromDescription?.[1]) return fromDescription[1].trim()

  const title = String(ticket?.title || '')
  const fromTitle = title.match(/^(.+?)\s+[—-]\s+/)
  if (fromTitle?.[1]) return fromTitle[1].trim()

  return ''
}

export function unpackTicket(ticket) {
  const extra = readCarrier(ticket?.labels)
  const tasks = preferList(ticket?.tasks, extra?.tasks)
  const assignees = preferList(ticket?.assignees, extra?.assignees)
  const followers = preferList(ticket?.followers, extra?.followers)
  const comments = preferList(ticket?.comments, extra?.comments)
  return {
    ...ticket,
    expediente: resolveExpediente(ticket, extra),
    importId: String(ticket?.importId || extra?.importId || '').trim(),
    labels: visibleLabels(ticket?.labels),
    ...(tasks ? { tasks } : {}),
    ...(assignees ? { assignees } : {}),
    ...(followers ? { followers } : {}),
    ...(comments ? { comments } : {}),
  }
}
function normalizeImport(item) {
  if (!item) return item
  const { fileBase64, hasFile, ...rest } = item
  return rest
}

function importsFromCarriers(tickets) {
  const byId = new Map()
  for (const ticket of tickets || []) {
    const extra = readCarrier(ticket?.labels)
    for (const item of extra?.imports || []) {
      if (item?.id) byId.set(item.id, normalizeImport(item))
    }
  }
  return [...byId.values()].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
}

export function unpackKanban(data) {
  const rawTickets = Array.isArray(data?.tickets) ? data.tickets : []
  const fromCarrier = importsFromCarriers(rawTickets)
  const fromApi = Array.isArray(data?.imports) ? data.imports.map(normalizeImport) : null
  const byId = new Map(fromCarrier.map((item) => [item.id, item]))
  if (fromApi) {
    for (const item of fromApi) {
      const previous = byId.get(item.id)
      byId.set(item.id, { ...previous, ...normalizeImport(item) })
    }
  }
  return {
    boards: Array.isArray(data?.boards) ? data.boards : [],
    tickets: rawTickets.map(unpackTicket),
    imports: [...byId.values()],
  }
}

export function packTicket(ticket, imports) {
  const tasks = ticketTasks(ticket)
  const expediente = String(ticket.expediente || '').trim()
  const extra = {
    assignees: Array.isArray(ticket.assignees) ? ticket.assignees : [],
    followers: Array.isArray(ticket.followers) ? ticket.followers : [],
    comments: Array.isArray(ticket.comments) ? ticket.comments : [],
    tasks,
    expediente,
    importId: String(ticket.importId || '').trim(),
    ...(imports ? { imports } : {}),
  }
  const pending = tasks.filter((task) => !task.done).map((task) => task.text).join('; ')
  return {
    ...ticket,
    expediente,
    tasks,
    task: pending,
    labels: [
      ...visibleLabels(ticket.labels),
      MARK + encodeURIComponent(JSON.stringify(extra)),
    ],
  }
}

export function packKanban(state) {
  const imports = (state.imports || []).map(normalizeImport)
  return {
    boards: state.boards,
    tickets: (state.tickets || []).map((ticket, index) => packTicket(ticket, index === 0 ? imports : null)),
    imports,
  }
}

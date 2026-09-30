import { ticketColumnId, COLUMNS, PRIORITIES } from '../constants/columns.js'
import { ticketAssignees, ticketFollowers } from './assignees.js'
import { resolveExpediente, visibleLabels } from './persist.js'

export const EMPTY_FILTERS = {
  query: '',
  column: '',
  priority: '',
  duePreset: '',
  dueFrom: '',
  dueTo: '',
  label: '',
  assignee: '',
  follower: '',
}

const FILTERS_STORAGE_PREFIX = 'lexora-board-filters:'

export function normalizeFilters(input) {
  const raw = input && typeof input === 'object' ? input : {}
  return {
    query: String(raw.query || ''),
    column: String(raw.column || ''),
    priority: String(raw.priority || ''),
    duePreset: String(raw.duePreset || ''),
    dueFrom: String(raw.dueFrom || ''),
    dueTo: String(raw.dueTo || ''),
    label: String(raw.label || ''),
    assignee: String(raw.assignee || ''),
    follower: String(raw.follower || ''),
  }
}

export function loadSavedFilters(boardId) {
  if (!boardId) return null
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_PREFIX + boardId)
    if (!raw) return null
    return normalizeFilters(JSON.parse(raw))
  } catch {
    return null
  }
}

export function saveFiltersToStorage(boardId, filters) {
  if (!boardId) return
  try {
    localStorage.setItem(FILTERS_STORAGE_PREFIX + boardId, JSON.stringify(normalizeFilters(filters)))
  } catch {
    // el tablero sigue usable sin persistencia local
  }
}

function todayISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDaysISO(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function parseTicketDue(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return null
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!dmy) return null
  return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
}

function matchesDuePreset(due, preset, today) {
  if (!preset) return true
  if (preset === 'none') return !due
  if (!due) return false
  if (preset === 'overdue') return due < today
  if (preset === 'today') return due === today
  if (preset === 'week') return due >= today && due <= addDaysISO(today, 7)
  return true
}

export function countActiveFilters(filters) {
  const f = normalizeFilters(filters)
  let count = 0
  if (f.query.trim()) count += 1
  if (f.column) count += 1
  if (f.priority) count += 1
  if (f.duePreset) count += 1
  if (f.dueFrom || f.dueTo) count += 1
  if (f.label) count += 1
  if (f.assignee) count += 1
  if (f.follower) count += 1
  return count
}

export function filterChips(filters) {
  const f = normalizeFilters(filters)
  const chips = []
  if (f.query.trim()) chips.push({ key: 'query', label: `Buscar: ${f.query.trim()}` })
  if (f.column) {
    const column = COLUMNS.find((item) => item.id === f.column)
    chips.push({ key: 'column', label: `Columna: ${column?.label || f.column}` })
  }
  if (f.priority) chips.push({ key: 'priority', label: `Prioridad: ${f.priority}` })
  if (f.duePreset) {
    const labels = {
      overdue: 'Vencidas',
      today: 'Vence hoy',
      week: 'Esta semana',
      none: 'Sin fecha',
    }
    chips.push({ key: 'duePreset', label: `Vencimiento: ${labels[f.duePreset] || f.duePreset}` })
  }
  if (f.dueFrom || f.dueTo) {
    chips.push({
      key: 'dueRange',
      label: `Rango: ${f.dueFrom || '…'} → ${f.dueTo || '…'}`,
    })
  }
  if (f.label) chips.push({ key: 'label', label: `Etiqueta: ${f.label}` })
  if (f.assignee) chips.push({ key: 'assignee', label: `Asignado: ${f.assignee}` })
  if (f.follower) chips.push({ key: 'follower', label: `Seguidor: ${f.follower}` })
  return chips
}

export function clearFilterKey(filters, key) {
  const next = { ...normalizeFilters(filters) }
  if (key === 'dueRange') {
    next.dueFrom = ''
    next.dueTo = ''
  } else if (Object.prototype.hasOwnProperty.call(next, key)) {
    next[key] = ''
  }
  return next
}

export function applyBoardFilters(tickets, filters) {
  const f = normalizeFilters(filters)
  const query = f.query.trim().toLowerCase()
  const today = todayISO()

  return (tickets || []).filter((ticket) => {
    if (query) {
      const haystack = [
        ticket.title,
        resolveExpediente(ticket),
        ticket.description,
      ].join(' ').toLowerCase()
      if (!haystack.includes(query)) return false
    }

    if (f.column && ticketColumnId(ticket) !== f.column) return false
    if (f.priority && (ticket.priority || '') !== f.priority) return false

    const due = parseTicketDue(ticket.dueDate)
    if (!matchesDuePreset(due, f.duePreset, today)) return false
    if (f.dueFrom && (!due || due < f.dueFrom)) return false
    if (f.dueTo && (!due || due > f.dueTo)) return false

    if (f.label) {
      const labels = visibleLabels(ticket.labels).map((label) => label.toLowerCase())
      if (!labels.includes(f.label.toLowerCase())) return false
    }

    if (f.assignee) {
      const assignees = ticketAssignees(ticket).map((name) => name.toLowerCase())
      if (!assignees.includes(f.assignee.toLowerCase())) return false
    }

    if (f.follower) {
      const followers = ticketFollowers(ticket).map((name) => name.toLowerCase())
      if (!followers.includes(f.follower.toLowerCase())) return false
    }

    return true
  })
}

export function collectFilterOptions(tickets) {
  const labels = new Set()
  const assignees = new Set()
  const followers = new Set()
  for (const ticket of tickets || []) {
    visibleLabels(ticket.labels).forEach((label) => labels.add(label))
    ticketAssignees(ticket).forEach((name) => assignees.add(name))
    ticketFollowers(ticket).forEach((name) => followers.add(name))
  }
  return {
    columns: COLUMNS,
    priorities: PRIORITIES,
    labels: [...labels].sort((a, b) => a.localeCompare(b, 'es')),
    assignees: [...assignees].sort((a, b) => a.localeCompare(b, 'es')),
    followers: [...followers].sort((a, b) => a.localeCompare(b, 'es')),
  }
}

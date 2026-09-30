const TIME_ZONE = 'America/Argentina/Buenos_Aires'

export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function addDays(iso, days) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function parseDueDate(value) {
  if (!value || typeof value !== 'string') return null
  const trimmed = value.trim()
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!dmy) return null
  return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
}

export function formatDueDate(iso) {
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}

export function isAboutToExpire(dueISO, today = todayISO(), daysBefore = 1) {
  if (!dueISO) return false
  const days = Math.max(0, Number(daysBefore) || 0)
  if (dueISO < today) return false
  return dueISO <= addDays(today, days)
}

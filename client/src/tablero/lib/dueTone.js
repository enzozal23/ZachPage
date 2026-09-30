const TIME_ZONE = 'America/Argentina/Buenos_Aires'
const NEAR_DAYS = 7
const FAR_DAYS = 14

export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function parseDue(value) {
  const trimmed = String(value || '').trim()
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!dmy) return null
  return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
}

function daysUntil(dueISO, today) {
  const [y1, m1, d1] = today.split('-').map(Number)
  const [y2, m2, d2] = dueISO.split('-').map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000)
}

/** Vencida: rojo tenue. Hasta 7 días: amarillo. Desde 14 días: sin color. */
export function dueTone(dueDate, today = todayISO()) {
  const due = parseDue(dueDate)
  if (!due) return null
  const days = daysUntil(due, today)
  if (days < 0) return 'overdue'
  if (days <= NEAR_DAYS) return 'near'
  if (days >= FAR_DAYS) return null
  return null
}

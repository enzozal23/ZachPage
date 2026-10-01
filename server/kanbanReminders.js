import mongoose from 'mongoose'
import Kanban from './models/kanban.model.js'
import User from './models/user.models.js'
import { sendMail } from './libs/mail.js'
import { formatDueDate, isAboutToExpire, parseDueDate, todayISO } from './libs/dueDates.js'
import { daysBeforeForTicket, publicSettings } from './libs/dueReminderSettings.js'
import { logError, logInfo } from './libs/appLog.js'
const TIME_ZONE = 'America/Argentina/Buenos_Aires'
const DIGEST_HOUR = 7
const CHECK_MS = 60 * 1000
let lastDigestDay = ''

function frontendBaseUrl() {
  const fromEnv = String(process.env.FRONTEND_URL || process.env.LEXORA_URL || '').trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  return 'https://zachpage-frontend.onrender.com'
}

export function ticketUrl(ticketId) {
  return `${frontendBaseUrl()}/t/${encodeURIComponent(ticketId)}`
}

function argentinaClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const value = (type) => parts.find((part) => part.type === type)?.value || '00'
  return {
    date: `${value('year')}-${value('month')}-${value('day')}`,
    hour: Number(value('hour')),
    minute: Number(value('minute')),
  }
}

function findUser(users, assignee) {
  const key = (assignee || '').trim().toLowerCase()
  if (!key) return null
  return users.find((user) =>
    (user.username || '').trim().toLowerCase() === key ||
    (user.email || '').trim().toLowerCase() === key
  ) || null
}

function taskLine(ticket) {
  const pending = Array.isArray(ticket.tasks)
    ? ticket.tasks.filter((task) => task?.text && !task.done).map((task) => task.text)
    : []
  if (pending.length) return `Tareas: ${pending.join('; ')}`
  const single = String(ticket.task || '').trim()
  if (!single || single.startsWith('__lexora:')) return ''
  return `Tarea: ${single}`
}

function peopleNames(ticket) {
  const assignees = Array.isArray(ticket.assignees) && ticket.assignees.length
    ? ticket.assignees
    : String(ticket.assignee || '').split(',')
  const followers = Array.isArray(ticket.followers) ? ticket.followers : []
  return [...assignees, ...followers].map((name) => String(name || '').trim()).filter(Boolean)
}

function digestBody({ username, items, today }) {
  const lines = [
    `Hola ${username || ''},`.trim(),
    '',
    `Estas son las tarjetas de Lexora dentro de la ventana de aviso configurada (${formatDueDate(today)}):`,
    '',
  ]

  items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}`)
    lines.push(`   Tablero: ${item.boardName}`)
    lines.push(`   Vence: ${item.when}`)
    if (item.tasks) lines.push(`   ${item.tasks}`)
    lines.push(`   Abrir: ${item.url}`)
    lines.push('')
  })

  lines.push('Entrá a Lexora para revisarlas.')
  return lines.join('\n')
}

async function loadUsersForTickets(tickets) {
  const lookup = [...new Set(tickets.flatMap(peopleNames))]
  if (!lookup.length) return []
  return User.find({
    $or: [{ username: { $in: lookup } }, { email: { $in: lookup } }],
  }).select('username email')
}

function recipientsForTicket(ticket, users) {
  const matched = []
  const seen = new Set()
  for (const name of peopleNames(ticket)) {
    const user = findUser(users, name)
    const email = user?.email?.trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    matched.push(user)
  }
  return matched
}

function ticketDigestItem(ticket, boardName) {
  const due = parseDueDate(ticket.dueDate)
  return {
    ticketId: ticket.id,
    due,
    title: ticket.title || 'Sin título',
    boardName: boardName || 'principal',
    when: due ? formatDueDate(due) : 'sin fecha',
    tasks: taskLine(ticket),
    url: ticketUrl(ticket.id),
  }
}

/** Un mail por destinatario con todas sus tarjetas por vencer. */
export async function sendDueDigest({ tickets, boards, markSent = true }) {
  if (!tickets.length) return { sent: 0, recipients: [] }

  const users = await loadUsersForTickets(tickets)
  const byEmail = new Map()

  for (const ticket of tickets) {
    const board = boards.find((item) => item.id === ticket.boardId)
    const item = ticketDigestItem(ticket, board?.name)
    const recipients = recipientsForTicket(ticket, users)
    if (!recipients.length) {
      await logInfo('Tarjeta por vencer sin destinatario', {
        ticketId: ticket.id,
        title: ticket.title,
      })
      continue
    }
    for (const user of recipients) {
      const email = user.email.trim().toLowerCase()
      if (!byEmail.has(email)) {
        byEmail.set(email, { user, items: [] })
      }
      byEmail.get(email).items.push(item)
    }
  }

  const today = todayISO()
  const recipients = []
  for (const [email, pack] of byEmail) {
    const items = pack.items
    await sendMail({
      to: email,
      kind: 'vencimiento',
      subject: items.length === 1
        ? `Lexora — Vence pronto: ${items[0].title}`
        : `Lexora — ${items.length} tarjetas por vencer`,
      text: digestBody({
        username: pack.user.username || email,
        items,
        today,
      }),
    })
    recipients.push(email)
  }

  if (markSent) {
    for (const ticket of tickets) {
      const due = parseDueDate(ticket.dueDate)
      if (due) ticket.reminderSentFor = due
    }
  }

  return { sent: recipients.length, recipients }
}

export async function sendTicketDueMail({ ticket, boardName }) {
  const result = await sendDueDigest({
    tickets: [ticket],
    boards: [{ id: ticket.boardId, name: boardName }],
    markSent: false,
  })
  if (!result.sent) {
    const error = new Error('Asigná un responsable o un seguidor que sea un usuario existente.')
    error.status = 400
    throw error
  }
  return result.recipients.join(', ')
}

export async function sendDueReminders({ trigger = 'interno' } = {}) {
  const startedAt = new Date().toISOString()
  await logInfo('Cron de vencimientos: inicio', { trigger, startedAt })

  const doc = await Kanban.findOne()
  if (!doc) {
    const summary = { trigger, startedAt, today: todayISO(), reviewed: 0, mails: 0, recipients: [], changed: false, reason: 'sin_tablero' }
    await logInfo('Cron de vencimientos: sin tablero guardado', summary)
    return summary
  }

  const today = todayISO()
  const settings = publicSettings(doc.settings)

  if (!settings.mailNotificationsEnabled) {
    const summary = {
      trigger,
      startedAt,
      today,
      reviewed: 0,
      mails: 0,
      recipients: [],
      changed: false,
      reason: 'notificaciones_desactivadas',
    }
    await logInfo('Cron de vencimientos: mails desactivados en configuración', summary)
    return summary
  }

  const dueTickets = []
  for (const ticket of doc.tickets) {
    if (ticket.status === 'done') continue
    const due = parseDueDate(ticket.dueDate)
    const daysBefore = daysBeforeForTicket(ticket, settings.dueReminders)
    if (daysBefore == null) continue
    if (!due || !isAboutToExpire(due, today, daysBefore)) continue
    if (ticket.reminderSentFor === due) continue
    dueTickets.push(ticket)
  }

  await logInfo('Cron de vencimientos: tarjetas candidatas', {
    trigger,
    today,
    ticketsTotales: doc.tickets.length,
    porVencer: dueTickets.length,
    reglas: settings.dueReminders.length,
    titulos: dueTickets.map((ticket) => ticket.title).slice(0, 20),
  })

  if (!dueTickets.length) {
    const summary = { trigger, startedAt, today, reviewed: 0, mails: 0, recipients: [], changed: false, reason: 'nada_por_vencer' }
    await logInfo('Cron de vencimientos: fin (nada por enviar)', summary)
    return summary
  }

  try {
    const result = await sendDueDigest({
      tickets: dueTickets,
      boards: doc.boards || [],
      markSent: true,
    })
    doc.markModified('tickets')
    await doc.save()
    const summary = {
      trigger,
      startedAt,
      finishedAt: new Date().toISOString(),
      today,
      reviewed: dueTickets.length,
      mails: result.sent,
      recipients: result.recipients,
      changed: true,
    }
    await logInfo('Cron de vencimientos: fin (mails enviados)', summary)
    return summary
  } catch (error) {
    await logError('Cron de vencimientos: falló el envío agrupado', error, {
      trigger,
      today,
      tickets: dueTickets.length,
    })
    throw error
  }
}

export function startDueReminders() {
  const tick = () => {
    const { date, hour, minute } = argentinaClock()
    if (hour !== DIGEST_HOUR || minute > 14) return
    if (lastDigestDay === date) return
    lastDigestDay = date
    logInfo('Disparo diario interno de vencimientos (07:00 Argentina)', { date, hour, minute })
    sendDueReminders({ trigger: 'interno-7am' }).catch((error) => {
      logError('No se pudo revisar los vencimientos', error)
    })
  }

  const arm = () => {
    tick()
    setInterval(tick, CHECK_MS)
  }

  if (mongoose.connection.readyState === 1) arm()
  else mongoose.connection.once('connected', arm)
}

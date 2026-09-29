import mongoose from 'mongoose'
import Kanban from './models/kanban.model.js'
import User from './models/user.models.js'
import { sendMail } from './libs/mail.js'
import { formatDueDate, isAboutToExpire, parseDueDate, todayISO } from './libs/dueDates.js'

const HOUR_MS = 60 * 60 * 1000

function findUser(users, assignee) {
  const key = (assignee || '').trim().toLowerCase()
  if (!key) return null
  return users.find((user) =>
    (user.username || '').trim().toLowerCase() === key ||
    (user.email || '').trim().toLowerCase() === key
  ) || null
}

export async function sendTicketDueMail({ ticket, boardName }) {
  const users = await User.find().select('username email')
  const user = findUser(users, ticket.assignee)
  if (!user?.email) {
    const error = new Error('Asigná un responsable que sea un usuario existente.')
    error.status = 400
    throw error
  }

  const due = parseDueDate(ticket.dueDate)
  const when = due ? formatDueDate(due) : 'sin fecha cargada'
  const name = user.username || user.email

  await sendMail({
    to: user.email,
    subject: `Vence pronto: ${ticket.title}`,
    text: [
      `Hola ${name},`,
      '',
      `La tarjeta "${ticket.title}" del tablero ${boardName || 'Kanban'} vence el ${when}.`,
      ticket.task ? `Tarea: ${ticket.task}` : '',
      ticket.description ? `\n${ticket.description}` : '',
    ].filter(Boolean).join('\n'),
  })

  return user.email
}

export async function sendDueReminders() {
  const doc = await Kanban.findOne()
  if (!doc) return

  const today = todayISO()
  let changed = false

  for (const ticket of doc.tickets) {
    if (ticket.status === 'done') continue
    const due = parseDueDate(ticket.dueDate)
    if (!due || !isAboutToExpire(due, today)) continue
    if (ticket.reminderSentFor === due) continue

    const board = doc.boards.find((item) => item.id === ticket.boardId)

    try {
      await sendTicketDueMail({ ticket, boardName: board?.name })
      ticket.reminderSentFor = due
      changed = true
    } catch (error) {
      if (error.status === 400) continue
      console.error(`[kanban] no se pudo avisar por ${ticket.title}`, error)
    }
  }

  if (changed) {
    doc.markModified('tickets')
    await doc.save()
  }
}

export function startDueReminders() {
  const run = () => {
    sendDueReminders().catch((error) => {
      console.error('[kanban] no se pudo enviar el recordatorio', error)
    })
  }

  if (mongoose.connection.readyState === 1) run()
  else mongoose.connection.once('connected', run)

  setInterval(run, HOUR_MS)
}

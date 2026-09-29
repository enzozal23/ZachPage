import mongoose from 'mongoose'
import Kanban from './models/kanban.model.js'
import User from './models/user.models.js'
import { sendMail } from './libs/mail.js'
import { formatDueDate, isAboutToExpire, parseDueDate, todayISO } from './libs/dueDates.js'
import { logError, logInfo } from './libs/appLog.js'

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
  await logInfo('Buscando responsable de la tarjeta', {
    ticketId: ticket.id,
    title: ticket.title,
    assignee: ticket.assignee || '',
    dueDate: ticket.dueDate || '',
    boardName: boardName || '',
  })

  const users = await User.find().select('username email')
  const user = findUser(users, ticket.assignee)
  if (!user?.email) {
    const error = new Error('Asigná un responsable que sea un usuario existente.')
    error.status = 400
    await logError('No hay usuario para el responsable', error, {
      ticketId: ticket.id,
      assignee: ticket.assignee || '',
      users: users.length,
    })
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
  if (!doc) {
    await logInfo('Revisión de vencimientos sin tablero guardado')
    return
  }

  const today = todayISO()
  let changed = false
  let reviewed = 0
  await logInfo('Revisando tarjetas por vencer', {
    today,
    tickets: doc.tickets.length,
  })

  for (const ticket of doc.tickets) {
    if (ticket.status === 'done') continue
    const due = parseDueDate(ticket.dueDate)
    if (!due || !isAboutToExpire(due, today)) continue
    if (ticket.reminderSentFor === due) continue

    reviewed += 1
    const board = doc.boards.find((item) => item.id === ticket.boardId)

    try {
      await sendTicketDueMail({ ticket, boardName: board?.name })
      ticket.reminderSentFor = due
      changed = true
    } catch (error) {
      if (error.status === 400) continue
      await logError('Falló el aviso automático', error, { ticketId: ticket.id, title: ticket.title })
    }
  }

  await logInfo('Revisión de vencimientos terminada', { today, reviewed, changed })

  if (changed) {
    doc.markModified('tickets')
    await doc.save()
  }
}

export function startDueReminders() {
  const run = () => {
    sendDueReminders().catch((error) => {
      logError('No se pudo revisar los vencimientos', error)
    })
  }

  if (mongoose.connection.readyState === 1) run()
  else mongoose.connection.once('connected', run)

  setInterval(run, HOUR_MS)
}

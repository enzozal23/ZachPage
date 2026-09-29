import Kanban from '../models/kanban.model.js'
import { sendDueReminders, sendTicketDueMail } from '../kanbanReminders.js'

function publicTicket(ticket) {
  return {
    id: ticket.id,
    boardId: ticket.boardId,
    title: ticket.title || '',
    description: ticket.description || '',
    status: ticket.status || 'todo',
    assignee: ticket.assignee || '',
    priority: ticket.priority || 'Media',
    labels: ticket.labels || [],
    dueDate: ticket.dueDate || '',
    task: ticket.task || '',
    createdAt: ticket.createdAt || '',
    source: ticket.source || 'manual',
  }
}

export const getKanban = async (req, res) => {
  const doc = await Kanban.findOne()
  if (!doc) return res.json({ boards: [], tickets: [] })
  res.json({
    boards: doc.boards,
    tickets: doc.tickets.map(publicTicket),
  })
}

export const saveKanban = async (req, res) => {
  const boards = Array.isArray(req.body?.boards) ? req.body.boards : []
  const incoming = Array.isArray(req.body?.tickets) ? req.body.tickets : []

  if (boards.length === 0) {
    return res.status(400).json({ message: 'Tiene que haber al menos un tablero.' })
  }

  let doc = await Kanban.findOne()
  const previous = new Map((doc?.tickets || []).map((ticket) => [ticket.id, ticket]))

  const tickets = incoming.map((ticket) => {
    const dueDate = ticket.dueDate || ''
    const old = previous.get(ticket.id)
    const reminderSentFor = old && old.dueDate === dueDate ? (old.reminderSentFor || '') : ''
    return {
      ...publicTicket(ticket),
      dueDate,
      reminderSentFor,
    }
  })

  if (!doc) doc = new Kanban({ boards, tickets })
  else {
    doc.boards = boards
    doc.tickets = tickets
  }

  await doc.save()
  sendDueReminders().catch((error) => {
    console.error('[kanban] no se pudo enviar el recordatorio', error)
  })

  res.json({
    boards: doc.boards,
    tickets: doc.tickets.map(publicTicket),
  })
}

export const testDueReminder = async (req, res) => {
  try {
    const doc = await Kanban.findOne()
    const ticket = doc?.tickets?.find((item) => item.id === req.params.id)
    if (!ticket) {
      return res.status(404).json({
        message: 'La tarjeta todavía no está guardada. Esperá un segundo y volvé a probar.',
      })
    }

    const board = doc.boards.find((item) => item.id === ticket.boardId)
    const email = await sendTicketDueMail({ ticket, boardName: board?.name })
    res.json({ message: `Mail enviado a ${email}` })
  } catch (error) {
    const status = error.status || 500
    res.status(status).json({
      message: error.status ? error.message : 'No se pudo enviar el mail.',
    })
  }
}

import Kanban from '../models/kanban.model.js'
import { sendDueReminders, sendTicketDueMail } from '../kanbanReminders.js'
import { logError, logInfo } from '../libs/appLog.js'

function publicComments(comments) {
  if (!Array.isArray(comments)) return []
  return comments
    .map((comment) => ({
      id: comment.id || '',
      text: comment.text || '',
      author: comment.author || '',
      createdAt: comment.createdAt || '',
    }))
    .filter((comment) => comment.text)
}

function publicAssignees(ticket) {
  const fromList = Array.isArray(ticket.assignees)
    ? ticket.assignees.map((name) => String(name || '').trim()).filter(Boolean)
    : []
  if (fromList.length) return [...new Set(fromList)]
  return String(ticket.assignee || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

function publicNameList(list) {
  if (!Array.isArray(list)) return []
  return [...new Set(list.map((name) => String(name || '').trim()).filter(Boolean))]
}

const CARRIER = '__lexora:'

function readCarrier(ticket) {
  const labels = Array.isArray(ticket.labels) ? ticket.labels.map((label) => String(label)) : []
  const carrier = labels.find((label) => label.startsWith(CARRIER))
  const visible = labels.filter((label) => !label.startsWith(CARRIER))
  if (!carrier) return { extra: null, labels: visible }
  try {
    return { extra: JSON.parse(decodeURIComponent(carrier.slice(CARRIER.length))), labels: visible }
  } catch {
    return { extra: null, labels: visible }
  }
}

function normalizeTasks(list) {
  if (!Array.isArray(list)) return []
  return list
    .map((task) => ({
      id: String(task?.id || ''),
      text: String(task?.text || '').trim(),
      done: Boolean(task?.done),
    }))
    .filter((task) => task.id && task.text)
}

function publicTasks(ticket, extra) {
  const fromTicket = normalizeTasks(ticket.tasks)
  if (fromTicket.length) return fromTicket
  const fromExtra = normalizeTasks(extra?.tasks)
  if (fromExtra.length) return fromExtra
  const legacy = String(ticket.task || '').trim()
  if (!legacy || legacy.startsWith(CARRIER)) return []
  return [{ id: `legacy-${ticket.id || 'task'}`, text: legacy, done: false }]
}

function publicTicket(ticket) {
  const { extra, labels } = readCarrier(ticket)
  const directAssignees = publicAssignees(ticket)
  const extraAssignees = publicAssignees({ assignees: extra?.assignees, assignee: '' })
  const assignees = extraAssignees.length > directAssignees.length ? extraAssignees : directAssignees
  const directFollowers = publicNameList(ticket.followers)
  const extraFollowers = publicNameList(extra?.followers)
  const followers = extraFollowers.length > directFollowers.length ? extraFollowers : directFollowers
  const tasks = publicTasks(ticket, extra)
  const comments = publicComments(
    publicComments(ticket.comments).length ? ticket.comments : extra?.comments,
  )
  const pending = tasks.filter((task) => !task.done).map((task) => task.text).join('; ')
  return {
    id: ticket.id,
    boardId: ticket.boardId,
    title: ticket.title || '',
    description: ticket.description || '',
    status: ticket.status || 'todo',
    assignee: assignees[0] || '',
    assignees,
    followers,
    priority: ticket.priority || 'Media',
    labels,
    dueDate: ticket.dueDate || '',
    task: pending,
    tasks,
    createdAt: ticket.createdAt || '',
    source: ticket.source || 'manual',
    comments,
  }
}

function importsFromTickets(tickets) {
  const byId = new Map()
  for (const ticket of tickets || []) {
    const { extra } = readCarrier(ticket)
    for (const item of extra?.imports || []) {
      if (item?.id) byId.set(item.id, publicImport(item))
    }
  }
  return [...byId.values()]
}

function publicImport(item) {
  return {
    id: item.id || '',
    fileName: item.fileName || '',
    boardId: item.boardId || '',
    boardName: item.boardName || '',
    imported: Number(item.imported) || 0,
    skippedNoTitle: Number(item.skippedNoTitle) || 0,
    createdAt: item.createdAt || '',
    author: item.author || '',
  }
}

export const getKanban = async (req, res) => {
  const doc = await Kanban.findOne()
  if (!doc) return res.json({ boards: [], tickets: [], imports: [] })
  res.json({
    boards: doc.boards,
    tickets: doc.tickets.map(publicTicket),
    imports: (doc.imports || []).map(publicImport),
  })
}

export const saveKanban = async (req, res) => {
  const boards = Array.isArray(req.body?.boards) ? req.body.boards : []
  const incoming = Array.isArray(req.body?.tickets) ? req.body.tickets : []
  const incomingImports = Array.isArray(req.body?.imports) ? req.body.imports.map(publicImport) : null

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

  const imports = incomingImports || importsFromTickets(incoming) || doc?.imports || []

  if (!doc) doc = new Kanban({ boards, tickets, imports })
  else {
    doc.boards = boards
    doc.tickets = tickets
    doc.imports = imports
    doc.markModified('tickets')
    doc.markModified('imports')
  }

  await doc.save()
  await logInfo('Tablero guardado', { boards: boards.length, tickets: tickets.length, imports: imports.length })

  res.json({
    boards: doc.boards,
    tickets: doc.tickets.map(publicTicket),
    imports: (doc.imports || []).map(publicImport),
  })
}

export const testDueReminder = async (req, res) => {
  await logInfo('Prueba de mail de vencimiento', { ticketId: req.params.id })
  try {
    const doc = await Kanban.findOne()
    const ticket = doc?.tickets?.find((item) => item.id === req.params.id)
    if (!ticket) {
      await logError('Tarjeta no encontrada para la prueba', null, { ticketId: req.params.id })
      return res.status(404).json({
        message: 'La tarjeta todavía no está guardada. Esperá un segundo y volvé a probar.',
      })
    }

    const board = doc.boards.find((item) => item.id === ticket.boardId)
    const email = await sendTicketDueMail({ ticket, boardName: board?.name })
    await logInfo('Prueba de mail enviada', { ticketId: ticket.id, to: email })
    res.json({ message: `Mail enviado a ${email}` })
  } catch (error) {
    const status = error.status || 500
    await logError('Falló la prueba de mail', error, { ticketId: req.params.id })
    res.status(status).json({
      message: error.message || 'No se pudo enviar el mail.',
    })
  }
}

export const runDueReminders = async (req, res) => {
  await logInfo('Cron externo: revisar vencimientos')
  try {
    await sendDueReminders()
    res.json({ message: 'Revisión de vencimientos ejecutada.' })
  } catch (error) {
    await logError('Cron externo falló', error)
    res.status(500).json({ message: error.message || 'No se pudo revisar los vencimientos.' })
  }
}

import Kanban from '../models/kanban.model.js'
import User from '../models/user.models.js'
import { sendDueReminders, sendTicketDueMail } from '../kanbanReminders.js'
import { logError, logInfo } from '../libs/appLog.js'
import {
  buildImportActivities,
  buildSettingsActivities,
  buildTicketActivities,
  requestIp,
  writeActivities,
} from '../libs/activityLog.js'
import { publicSettings } from '../libs/dueReminderSettings.js'
import { botonesDe, tiene_permiso } from '../libs/permisos.js'

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
  let expediente = String(ticket.expediente || extra?.expediente || '').trim()
  if (!expediente) {
    const fromDescription = String(ticket.description || '').match(/^Expediente:\s*(.+)$/im)
    if (fromDescription?.[1]) expediente = fromDescription[1].trim()
  }
  if (!expediente) {
    const fromTitle = String(ticket.title || '').match(/^(.+?)\s+[—-]\s+/)
    if (fromTitle?.[1]) expediente = fromTitle[1].trim()
  }
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
    expediente,
    clientId: String(ticket.clientId || extra?.clientId || '').trim(),
    clientName: String(ticket.clientName || extra?.clientName || '').trim(),
    task: pending,
    tasks,
    createdAt: ticket.createdAt || '',
    source: ticket.source || 'manual',
    importId: String(ticket.importId || extra?.importId || '').trim(),
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

async function botonesKanban(req) {
  const rol = req.user?.role
  return {
    tablero: await botonesDe(rol, 'tablero'),
    importaciones: await botonesDe(rol, 'importaciones'),
  }
}

export const getKanban = async (req, res) => {
  const botones = await botonesKanban(req)
  const doc = await Kanban.findOne()
  if (!doc) return res.json({ boards: [], tickets: [], imports: [], settings: publicSettings({}), botones })
  res.json({
    boards: doc.boards,
    tickets: doc.tickets.map(publicTicket),
    imports: (doc.imports || []).map(publicImport),
    settings: publicSettings(doc.settings),
    botones,
  })
}

export const getSettings = async (req, res) => {
  const doc = await Kanban.findOne()
  res.json({
    ...publicSettings(doc?.settings),
    botones: await botonesDe(req.user?.role, 'configuraciones'),
  })
}

export const saveSettings = async (req, res) => {
  const next = publicSettings(req.body || {})
  const doc = await Kanban.findOne()
  if (!doc) {
    return res.status(404).json({ message: 'Todavía no hay un tablero guardado.' })
  }

  const previous = publicSettings(doc.settings)
  doc.settings = next
  doc.markModified('settings')
  await doc.save()

  const userDoc = req.user?.id ? await User.findById(req.user.id).select('username email') : null
  const actor = {
    userId: String(req.user?.id || userDoc?._id || ''),
    username: userDoc?.username || '',
    email: userDoc?.email || '',
  }
  const ip = requestIp(req)
  const activities = buildSettingsActivities({
    previousSettings: previous,
    nextSettings: next,
    actor,
    ip,
  })
  writeActivities(activities).catch(() => {})

  await logInfo('Configuración guardada', {
    userId: actor.userId,
    username: actor.username,
    email: actor.email,
    ip,
    mailNotificationsEnabled: next.mailNotificationsEnabled,
    dueReminders: next.dueReminders.length,
    changes: activities.map((item) => item.summary),
  })

  res.json(publicSettings(doc.settings))
}

function firmaTicket(ticket) {
  const copy = { ...(ticket || {}) }
  delete copy.reminderSentFor
  return JSON.stringify(copy)
}

async function permisoFaltanteDelTablero(rol, cambio) {
  const antes = new Map((cambio.previousTickets || []).map((ticket) => [ticket.id, ticket]))
  const despues = new Map((cambio.nextTickets || []).map((ticket) => [ticket.id, ticket]))
  let crear = false
  let editar = false
  let eliminar = false
  for (const [id, ticket] of despues) {
    if (!antes.has(id)) crear = true
    else if (firmaTicket(antes.get(id)) !== firmaTicket(ticket)) editar = true
  }
  for (const id of antes.keys()) {
    if (!despues.has(id)) eliminar = true
  }
  if (JSON.stringify(cambio.previousBoards || []) !== JSON.stringify(cambio.nextBoards || [])) editar = true
  const antesImp = new Set((cambio.previousImports || []).map((item) => item.id))
  const despuesImp = new Set((cambio.nextImports || []).map((item) => item.id))
  let importar = false
  let borrarImport = false
  for (const id of despuesImp) if (!antesImp.has(id)) importar = true
  for (const id of antesImp) if (!despuesImp.has(id)) borrarImport = true
  const pedidos = []
  if (crear) pedidos.push('tablero.crear')
  if (editar) pedidos.push('tablero.editar')
  if (eliminar) pedidos.push('tablero.eliminar')
  if (importar) pedidos.push('importaciones.importar')
  if (borrarImport) pedidos.push('importaciones.eliminar')
  for (const permiso of pedidos) {
    if (!(await tiene_permiso(rol, permiso))) return permiso
  }
  return ''
}

export const saveKanban = async (req, res) => {
  const boards = Array.isArray(req.body?.boards) ? req.body.boards : []
  const incoming = Array.isArray(req.body?.tickets) ? req.body.tickets : []
  const incomingImports = Array.isArray(req.body?.imports) ? req.body.imports.map(publicImport) : null

  if (boards.length === 0) {
    return res.status(400).json({ message: 'Tiene que haber al menos un tablero.' })
  }

  try {
  let doc = await Kanban.findOne()
  const previousStored = doc?.tickets || []
  const previousRaw = previousStored.map(publicTicket)
  const previousImports = (doc?.imports || []).map(publicImport)
  const previous = new Map(previousStored.map((ticket) => [ticket.id, ticket]))

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
  const faltante = await permisoFaltanteDelTablero(req.user?.role, {
    previousTickets: previousRaw,
    nextTickets: tickets.map(publicTicket),
    previousImports,
    nextImports: (imports || []).map(publicImport),
    previousBoards: doc?.boards || [],
    nextBoards: boards,
  })
  if (faltante) return res.status(403).json({ message: 'No tenés permiso para esto.' })

  const saved = doc
    ? await Kanban.findByIdAndUpdate(doc._id, { $set: { boards, tickets, imports } }, { new: true })
    : await Kanban.create({ boards, tickets, imports })
  if (!saved) return res.status(500).json({ message: 'No se pudo guardar en el servidor.' })
  doc = saved
  await logInfo('Tablero guardado', { boards: boards.length, tickets: tickets.length, imports: imports.length })

  const userDoc = req.user?.id ? await User.findById(req.user.id).select('username email') : null
  const actor = {
    userId: String(req.user?.id || userDoc?._id || ''),
    username: userDoc?.username || '',
    email: userDoc?.email || '',
  }
  const ip = requestIp(req)
  const activities = [
    ...buildTicketActivities({
      previousTickets: previousRaw,
      nextTickets: tickets.map(publicTicket),
      actor,
      ip,
    }),
    ...buildImportActivities({
      previousImports,
      nextImports: (imports || []).map(publicImport),
      actor,
      ip,
    }),
  ]
  writeActivities(activities).catch(() => {})

  res.json({
    boards: doc.boards,
    tickets: doc.tickets.map(publicTicket),
    imports: (doc.imports || []).map(publicImport),
    botones: await botonesKanban(req),
  })
  } catch (error) {
    console.error(error)
    await logError('No se pudo guardar el tablero', error, {})
    if (!res.headersSent) res.status(500).json({ message: 'No se pudo guardar en el servidor.' })
  }
}

export const importKanbanWord = async (req, res) => {
  const incoming = Array.isArray(req.body?.tickets) ? req.body.tickets : []
  const entry = req.body?.import && req.body.import.id ? publicImport(req.body.import) : null
  if (!incoming.length && !entry) {
    return res.status(400).json({ message: 'La importación no trae tarjetas.' })
  }

  try {
    const doc = await Kanban.findOne()
    if (!doc) return res.status(400).json({ message: 'Todavía no hay un tablero guardado.' })

    const existingIds = new Set((doc.tickets || []).map((ticket) => ticket.id))
    const added = incoming
      .map((ticket) => ({ ...publicTicket(ticket), reminderSentFor: '' }))
      .filter((ticket) => ticket.id && !existingIds.has(ticket.id))
    const existingImports = new Set((doc.imports || []).map((item) => item.id))
    const push = {}
    if (added.length) push.tickets = { $each: added }
    if (entry?.id && !existingImports.has(entry.id)) push.imports = { $each: [entry], $position: 0 }

    const saved = Object.keys(push).length
      ? await Kanban.findByIdAndUpdate(doc._id, { $push: push }, { new: true })
      : doc
    if (!saved) return res.status(500).json({ message: 'No se pudo guardar en el servidor.' })

    const previousRaw = (doc.tickets || []).map(publicTicket)
    const nextRaw = (saved.tickets || []).map(publicTicket)
    const previousImports = (doc.imports || []).map(publicImport)
    const nextImports = (saved.imports || []).map(publicImport)
    const userDoc = req.user?.id ? await User.findById(req.user.id).select('username email') : null
    const actor = {
      userId: String(req.user?.id || userDoc?._id || ''),
      username: userDoc?.username || '',
      email: userDoc?.email || '',
    }
    const ip = requestIp(req)
    writeActivities([
      ...buildTicketActivities({ previousTickets: previousRaw, nextTickets: nextRaw, actor, ip }),
      ...buildImportActivities({ previousImports, nextImports, actor, ip }),
    ]).catch(() => {})

    res.json({
      boards: saved.boards,
      tickets: nextRaw,
      imports: nextImports,
      botones: await botonesKanban(req),
    })
  } catch (error) {
    console.error(error)
    await logError('No se pudo importar el Word', error, {})
    if (!res.headersSent) res.status(500).json({ message: 'No se pudo guardar en el servidor.' })
  }
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
    const status = error.status && error.status < 500 ? error.status : 500
    await logError('Falló la prueba de mail', error, { ticketId: req.params.id })
    res.status(status).json({
      message: status < 500 && error.message ? error.message : 'No se pudo enviar el mail.',
    })
  }
}

export const runDueReminders = async (req, res) => {
  const trigger = String(req.headers['x-cron-trigger'] || 'github-actions').slice(0, 80)
  await logInfo('Cron externo: pedido recibido', {
    trigger,
    at: new Date().toISOString(),
    ip: req.ip,
  })
  try {
    const summary = await sendDueReminders({ trigger })
    await logInfo('Cron externo: pedido terminado', summary)
    res.json({
      message: 'Revisión de vencimientos ejecutada.',
      ...summary,
    })
  } catch (error) {
    await logError('Cron externo falló', error, { trigger })
    res.status(500).json({ message: 'No se pudo revisar los vencimientos.' })
  }
}

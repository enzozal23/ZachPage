import mongoose from 'mongoose'
import Kanban from '../models/kanban.model.js'
import Client from '../models/client.model.js'
import ClientField from '../models/clientField.model.js'
import User from '../models/user.models.js'
import RolePermission from '../models/rolePermission.model.js'
import ActivityLog from '../models/activity.model.js'
import MailLog from '../models/mailLog.model.js'
import SessionLog from '../models/sessionLog.model.js'
import AppLog from '../models/log.model.js'

const VERSION = 1
const MAX_ITEMS = 50000

function clean(doc) {
  if (!doc) return null
  const copy = { ...doc }
  delete copy.__v
  if (copy._id) copy._id = String(copy._id)
  for (const key of ['createdAt', 'updatedAt']) {
    if (copy[key]) copy[key] = new Date(copy[key]).toISOString()
  }
  return copy
}

function lista(value) {
  return Array.isArray(value) ? value : null
}

function objectId(value) {
  const text = String(value || '').trim()
  return /^[a-fA-F0-9]{24}$/.test(text) ? text : ''
}

function conId(item) {
  const id = objectId(item?._id)
  const next = { ...item }
  delete next._id
  delete next.__v
  if (id) next._id = new mongoose.Types.ObjectId(id)
  return next
}

export async function armarBackup() {
  const [kanban, clients, clientFields, users, permisos, actividades, mails, sesiones, logs] = await Promise.all([
    Kanban.findOne().lean(),
    Client.find().lean(),
    ClientField.find().lean(),
    User.find().select('username email password role tokenVersion createdAt updatedAt').lean(),
    RolePermission.find().lean(),
    ActivityLog.find().lean(),
    MailLog.find().lean(),
    SessionLog.find().lean(),
    AppLog.find().lean(),
  ])
  const tablero = kanban ? clean(kanban) : { boards: [], tickets: [], imports: [], settings: {} }
  delete tablero._id
  return {
    app: 'lexora',
    version: VERSION,
    createdAt: new Date().toISOString(),
    kanban: {
      boards: tablero.boards || [],
      tickets: tablero.tickets || [],
      imports: tablero.imports || [],
      settings: tablero.settings || {},
    },
    clients: clients.map(clean),
    clientFields: clientFields.map(clean),
    users: users.map(clean),
    permisos: permisos.map(clean),
    actividades: actividades.map(clean),
    mails: mails.map(clean),
    sesiones: sesiones.map(clean),
    logs: logs.map(clean),
  }
}

function validarLista(nombre, value, errors) {
  const items = lista(value)
  if (!items) {
    errors.push(`Falta la lista de ${nombre}.`)
    return []
  }
  if (items.length > MAX_ITEMS) errors.push(`La lista de ${nombre} es demasiado grande.`)
  return items
}

export function validarBackup(body) {
  const errors = []
  if (!body || body.app !== 'lexora' || body.version !== VERSION) {
    return ['El archivo no es un backup de Lexora.']
  }
  const kanban = body.kanban
  if (!kanban || typeof kanban !== 'object' || Array.isArray(kanban)) {
    errors.push('El backup no trae el tablero.')
  } else {
    if (!Array.isArray(kanban.boards) || !Array.isArray(kanban.tickets) || !Array.isArray(kanban.imports)) {
      errors.push('El tablero del backup está incompleto.')
    }
    if (kanban.tickets?.length > MAX_ITEMS || kanban.boards?.length > MAX_ITEMS) {
      errors.push('El tablero del backup es demasiado grande.')
    }
  }
  const clients = validarLista('clientes', body.clients, errors)
  const clientFields = validarLista('campos', body.clientFields, errors)
  const users = validarLista('usuarios', body.users, errors)
  const permisos = validarLista('permisos', body.permisos, errors)
  validarLista('acciones', body.actividades, errors)
  validarLista('mails', body.mails, errors)
  validarLista('sesiones', body.sesiones, errors)
  validarLista('logs', body.logs, errors)

  const documentos = new Set()
  for (const client of clients) {
    const documento = String(client?.documento || '').trim()
    const tipo = client?.tipo
    if (!documento) errors.push('Hay un cliente sin documento.')
    else if (documentos.has(documento)) errors.push(`El documento ${documento} está repetido.`)
    else documentos.add(documento)
    if (tipo !== 'fisica' && tipo !== 'juridica') errors.push('Hay un cliente con un tipo inválido.')
    if (client?.criticidad && !['alta', 'media', 'baja'].includes(client.criticidad)) {
      errors.push('Hay un cliente con una criticidad inválida.')
    }
  }
  const claves = new Set()
  for (const field of clientFields) {
    if (!String(field?.nombre || '').trim()) errors.push('Hay un campo de cliente sin nombre.')
    const clave = String(field?.clave || '').trim()
    if (clave && claves.has(clave)) errors.push(`La clave ${clave} está repetida.`)
    if (clave) claves.add(clave)
  }
  const mails = new Set()
  for (const user of users) {
    const email = String(user?.email || '').trim().toLowerCase()
    if (!email) errors.push('Hay un usuario sin mail.')
    else if (mails.has(email)) errors.push(`El mail ${email} está repetido.`)
    else mails.add(email)
    if (user?.role && user.role !== 'admin' && user.role !== 'user' && user.role !== '0623') errors.push('Hay un usuario con un rol inválido.')
  }
  const roles = new Set()
  for (const item of permisos) {
    if (item?.role !== 'admin' && item?.role !== 'user') errors.push('Hay un permiso con un rol inválido.')
    else if (roles.has(item.role)) errors.push('Hay permisos repetidos para el mismo rol.')
    else roles.add(item.role)
  }
  return [...new Set(errors)].slice(0, 8)
}

async function reemplazar(Model, items) {
  await Model.deleteMany({})
  if (!items.length) return
  await Model.insertMany(items.map(conId), { ordered: true })
}

export async function restaurarBackup(body, actorId) {
  const errors = validarBackup(body)
  if (errors.length) return { errors }
  const me = actorId ? await User.findById(actorId).lean() : null
  const tokenVersion = Number(me?.tokenVersion || 0)
  await Kanban.deleteMany({})
  await Kanban.create({
    boards: body.kanban.boards,
    tickets: body.kanban.tickets,
    imports: body.kanban.imports,
    settings: body.kanban.settings || {},
  })
  await reemplazar(Client, body.clients)
  await reemplazar(ClientField, body.clientFields)
  await reemplazar(User, body.users)
  await reemplazar(RolePermission, body.permisos)
  await reemplazar(ActivityLog, body.actividades)
  await reemplazar(MailLog, body.mails)
  await reemplazar(SessionLog, body.sesiones)
  await reemplazar(AppLog, body.logs)
  if (me?._id) {
    const restored = await User.findById(me._id)
    if (!restored) {
      const copy = { ...me }
      delete copy.__v
      await User.create(copy)
    } else if (Number(restored.tokenVersion || 0) !== tokenVersion) {
      restored.tokenVersion = tokenVersion
      await restored.save()
    }
  }
  return {
    errors: [],
    counts: {
      tickets: body.kanban.tickets.length,
      clients: body.clients.length,
      users: body.users.length,
    },
  }
}

import Client from '../models/client.model.js'
import User from '../models/user.models.js'
import { requestIp, writeActivities } from '../libs/activityLog.js'

const TIPOS = new Set(['fisica', 'juridica'])
const CRITICIDAD = new Set(['alta', 'media', 'baja'])

function digits(value) {
  return String(value || '').replace(/\D/g, '')
}

function normalizeTipo(value) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
  if (['fisica', 'pf', 'persona fisica', 'particular', 'individual'].includes(text)) return 'fisica'
  if (['juridica', 'pj', 'persona juridica', 'empresa', 'sociedad'].includes(text)) return 'juridica'
  return ''
}

function normalizeCriticidad(value) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
  if (['alta', 'alto', 'high', 'a'].includes(text)) return 'alta'
  if (['media', 'medio', 'm'].includes(text)) return 'media'
  if (['baja', 'bajo', 'low', 'b'].includes(text)) return 'baja'
  return ''
}

export function normalizeClient(input) {
  const tipo = normalizeTipo(input?.tipo)
  const nombre = String(input?.nombre || '').trim()
  const apellido = String(input?.apellido || '').trim()
  const razonSocial = String(input?.razonSocial || input?.razon_social || '').trim()
  const email = String(input?.email || input?.mail || '').trim().toLowerCase()
  const telefono = String(input?.telefono || input?.phone || '').trim()
  const documento = digits(input?.documento || input?.dni || input?.cuit)
  const criticidad = normalizeCriticidad(input?.criticidad) || 'media'
  const errors = []
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('El mail no es válido.')
  if (telefono && digits(telefono).length < 6) errors.push('El teléfono tiene que tener al menos 6 dígitos.')
  if (!TIPOS.has(tipo)) errors.push('El tipo tiene que ser persona física o jurídica.')
  if (!documento) errors.push('Falta el DNI o el CUIT.')
  else if (![7, 8, 11].includes(documento.length)) errors.push('El DNI tiene 7 u 8 dígitos y el CUIT 11.')
  if (tipo === 'fisica' && !nombre) errors.push('Falta el nombre.')
  if (tipo === 'fisica' && !apellido) errors.push('Falta el apellido.')
  if (tipo === 'juridica' && !razonSocial) errors.push('Falta la razón social.')
  if (!CRITICIDAD.has(criticidad)) errors.push('La criticidad tiene que ser alta, media o baja.')
  return {
    value: { tipo, nombre, apellido, documento, razonSocial, email, telefono, criticidad },
    errors,
  }
}

function publicClient(doc) {
  return {
    id: String(doc._id),
    tipo: doc.tipo,
    nombre: doc.nombre || '',
    apellido: doc.apellido || '',
    documento: doc.documento || '',
    razonSocial: doc.razonSocial || '',
    email: doc.email || '',
    telefono: doc.telefono || '',
    criticidad: doc.criticidad || 'media',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

function clientName(client) {
  if (client.tipo === 'juridica') return client.razonSocial || client.documento
  const person = `${client.nombre || ''} ${client.apellido || ''}`.trim()
  return person || client.razonSocial || client.documento
}

function tipoLabel(tipo) {
  return tipo === 'juridica' ? 'persona jurídica' : 'persona física'
}

function criticidadLabel(value) {
  if (value === 'alta') return 'alta'
  if (value === 'baja') return 'baja'
  return 'media'
}

function changeEntries(before, after, actor) {
  const name = clientName(after)
  const base = {
    entity: 'client',
    ticketId: '',
    ticketTitle: name,
    ...actor,
  }
  const entries = []
  const push = (action, summary) => entries.push({ ...base, action, summary })
  if (before.tipo !== after.tipo) {
    push('update', `Actualizó el tipo de «${name}»: ${tipoLabel(before.tipo)} → ${tipoLabel(after.tipo)}`)
  }
  if ((before.nombre || '') !== (after.nombre || '')) {
    push('update', `Actualizó el nombre de «${name}»: «${before.nombre || 'vacío'}» → «${after.nombre || 'vacío'}»`)
  }
  if ((before.apellido || '') !== (after.apellido || '')) {
    push('update', `Actualizó el apellido de «${name}»: «${before.apellido || 'vacío'}» → «${after.apellido || 'vacío'}»`)
  }
  if ((before.documento || '') !== (after.documento || '')) {
    push('update', `Actualizó el DNI o CUIT de «${name}»: «${before.documento}» → «${after.documento}»`)
  }
  if ((before.razonSocial || '') !== (after.razonSocial || '')) {
    push('update', `Actualizó la razón social de «${name}»: «${before.razonSocial || 'vacío'}» → «${after.razonSocial || 'vacío'}»`)
  }
  if ((before.email || '') !== (after.email || '')) {
    push('update', `Actualizó el mail de «${name}»: «${before.email || 'vacío'}» → «${after.email || 'vacío'}»`)
  }
  if ((before.telefono || '') !== (after.telefono || '')) {
    push('update', `Actualizó el teléfono de «${name}»: «${before.telefono || 'vacío'}» → «${after.telefono || 'vacío'}»`)
  }
  if ((before.criticidad || '') !== (after.criticidad || '')) {
    push('update', `Actualizó la criticidad de «${name}»: ${criticidadLabel(before.criticidad)} → ${criticidadLabel(after.criticidad)}`)
  }
  return entries
}

async function actorOf(req) {
  const userDoc = req.user?.id ? await User.findById(req.user.id).select('username email') : null
  return {
    userId: String(req.user?.id || ''),
    username: userDoc?.username || '',
    email: userDoc?.email || '',
    ip: requestIp(req),
  }
}

export const listClients = async (_req, res) => {
  const docs = await Client.find().sort({ razonSocial: 1, apellido: 1, nombre: 1 }).limit(5000)
  res.json(docs.map(publicClient))
}

export const createClient = async (req, res) => {
  const { value, errors } = normalizeClient(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })
  const taken = await Client.findOne({ documento: value.documento })
  if (taken) return res.status(409).json({ message: 'Ya hay un cliente con ese DNI o CUIT.' })
  const doc = await Client.create(value)
  const actor = await actorOf(req)
  const saved = publicClient(doc)
  await writeActivities([{
    action: 'create',
    entity: 'client',
    ticketId: '',
    ticketTitle: clientName(saved),
    summary: `Agregó el cliente «${clientName(saved)}»`,
    ...actor,
    detail: saved,
  }])
  res.status(201).json(saved)
}

export const updateClient = async (req, res) => {
  const current = await Client.findById(req.params.id)
  if (!current) return res.status(404).json({ message: 'No se encontró el cliente.' })
  const { value, errors } = normalizeClient({ ...publicClient(current), ...req.body })
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })
  const taken = await Client.findOne({ documento: value.documento, _id: { $ne: current._id } })
  if (taken) return res.status(409).json({ message: 'Ya hay un cliente con ese DNI o CUIT.' })
  const before = publicClient(current)
  Object.assign(current, value)
  await current.save()
  const after = publicClient(current)
  const actor = await actorOf(req)
  await writeActivities(changeEntries(before, after, actor))
  res.json(after)
}

export const deleteClient = async (req, res) => {
  const current = await Client.findById(req.params.id)
  if (!current) return res.status(404).json({ message: 'No se encontró el cliente.' })
  const saved = publicClient(current)
  await current.deleteOne()
  const actor = await actorOf(req)
  await writeActivities([{
    action: 'delete',
    entity: 'client',
    ticketId: '',
    ticketTitle: clientName(saved),
    summary: `Eliminó el cliente «${clientName(saved)}»`,
    ...actor,
    detail: saved,
  }])
  res.json(saved)
}

export const importClients = async (req, res) => {
  const rows = Array.isArray(req.body?.clients) ? req.body.clients : null
  if (!rows) return res.status(400).json({ message: 'El archivo no tiene clientes para importar.' })
  if (rows.length > 2000) return res.status(400).json({ message: 'Se pueden importar hasta 2000 clientes por vez.' })

  const parsed = []
  const errors = []
  rows.forEach((row, index) => {
    const { value, errors: rowErrors } = normalizeClient(row)
    if (rowErrors.length) errors.push({ row: Number(row?.row) || index + 1, message: rowErrors.join(' ') })
    else parsed.push({ row: Number(row?.row) || index + 1, value })
  })

  const seen = new Set()
  const unique = []
  for (const item of parsed) {
    if (seen.has(item.value.documento)) {
      errors.push({ row: item.row, message: `El DNI o CUIT ${item.value.documento} está repetido en el archivo.` })
      continue
    }
    seen.add(item.value.documento)
    unique.push(item)
  }

  const existing = await Client.find({ documento: { $in: [...seen] } })
  const byDocumento = new Map(existing.map((doc) => [doc.documento, doc]))
  const actor = await actorOf(req)
  const activities = []
  let created = 0
  let updated = 0

  for (const item of unique) {
    const current = byDocumento.get(item.value.documento)
    if (!current) {
      const doc = await Client.create(item.value)
      created += 1
      const saved = publicClient(doc)
      activities.push({
        action: 'create',
        entity: 'client',
        ticketId: '',
        ticketTitle: clientName(saved),
        summary: `Agregó el cliente «${clientName(saved)}» desde Excel`,
        ...actor,
        detail: saved,
      })
      continue
    }
    const before = publicClient(current)
    Object.assign(current, item.value)
    await current.save()
    const after = publicClient(current)
    const changes = changeEntries(before, after, actor).map((entry) => ({
      ...entry,
      summary: `${entry.summary} (Excel)`,
    }))
    if (changes.length) updated += 1
    activities.push(...changes)
  }

  await writeActivities(activities)
  res.json({ created, updated, errors })
}

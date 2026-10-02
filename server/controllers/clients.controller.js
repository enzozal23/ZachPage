import Client from '../models/client.model.js'
import ClientField from '../models/clientField.model.js'
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
  const poder = readFlag(input?.poder)
  const patrocinio = readFlag(input?.patrocinio)
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
  const value = { tipo, nombre, apellido, documento, razonSocial, email, telefono, criticidad }
  if (poder !== undefined) value.poder = poder
  if (patrocinio !== undefined) value.patrocinio = patrocinio
  return { value, errors }
}

function readFlag(value) {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  const text = String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
  if (['si', 's', '1', 'true', 'x', 'yes'].includes(text)) return true
  if (['no', 'n', '0', 'false'].includes(text)) return false
  return undefined
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
    poder: Boolean(doc.poder),
    patrocinio: Boolean(doc.patrocinio),
    extras: doc.extras && typeof doc.extras === 'object' ? doc.extras : {},
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

function changeEntries(before, after, actor, fields = []) {
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
  if (Boolean(before.poder) !== Boolean(after.poder)) {
    push('update', after.poder ? `Marcó poder en «${name}»` : `Sacó poder de «${name}»`)
  }
  if (Boolean(before.patrocinio) !== Boolean(after.patrocinio)) {
    push('update', after.patrocinio ? `Marcó patrocinio en «${name}»` : `Sacó patrocinio de «${name}»`)
  }
  entries.push(...extraChangeEntries(before, after, actor, fields))
  return entries
}

function extraText(field, value) {
  if (field.tipo === 'checkbox') return value ? 'marcado' : 'sin marcar'
  if (value === undefined || value === null || value === '') return 'vacío'
  if (field.tipo === 'selector') {
    const option = (field.opciones || []).find((item) => (item?.value || item) === value)
    return option?.label || String(value)
  }
  return String(value)
}

function extraChangeEntries(before, after, actor, fields = []) {
  const name = clientName(after)
  const prev = before.extras || {}
  const next = after.extras || {}
  const entries = []
  for (const field of fields) {
    if (field.clave) continue
    const left = prev[field.id]
    const right = next[field.id]
    const same = field.tipo === 'checkbox' ? Boolean(left) === Boolean(right) : String(left ?? '') === String(right ?? '')
    if (same) continue
    const had = field.tipo === 'checkbox' ? Boolean(left) : String(left ?? '') !== ''
    const has = field.tipo === 'checkbox' ? Boolean(right) : String(right ?? '') !== ''
    const action = !had && has ? 'create' : had && !has ? 'delete' : 'update'
    const summary = action === 'create'
      ? `Agregó ${field.nombre} «${extraText(field, right)}» en «${name}»`
      : action === 'delete'
        ? `Eliminó ${field.nombre} «${extraText(field, left)}» de «${name}»`
        : `Actualizó ${field.nombre} de «${name}»: «${extraText(field, left)}» → «${extraText(field, right)}»`
    entries.push({
      action,
      entity: 'client',
      ticketId: '',
      ticketTitle: name,
      summary,
      ...actor,
      detail: { field: field.nombre, before: left ?? '', after: right ?? '' },
    })
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

export const logClientsExport = async (req, res) => {
  const count = Number(req.body?.count)
  const total = Number.isFinite(count) && count >= 0 ? count : 0
  const actor = await actorOf(req)
  await writeActivities([{
    action: 'create',
    entity: 'client',
    ticketId: '',
    ticketTitle: 'Exportación Excel',
    summary: `Exportó ${total} clientes a Excel`,
    ...actor,
    detail: { count: total },
  }])
  res.json({ ok: true })
}

export const listClients = async (_req, res) => {
  const docs = await Client.find().sort({ razonSocial: 1, apellido: 1, nombre: 1 }).limit(5000)
  res.json(docs.map(publicClient))
}

const FIELD_TYPES = new Set(['texto', 'numero', 'fecha', 'checkbox', 'selector'])

function publicOption(item) {
  if (item && typeof item === 'object') {
    const value = String(item.value || '').trim()
    const label = String(item.label || value).trim()
    return value ? { value, label } : null
  }
  const value = String(item || '').trim()
  return value ? { value, label: value } : null
}

function publicField(doc) {
  return {
    id: String(doc._id),
    nombre: doc.nombre || '',
    tipo: doc.tipo,
    orden: Number(doc.orden) || 0,
    requerido: Boolean(doc.requerido),
    opciones: (Array.isArray(doc.opciones) ? doc.opciones : []).map(publicOption).filter(Boolean),
    clave: doc.clave || '',
  }
}

function normalizeField(input) {
  const nombre = String(input?.nombre || '').trim()
  const tipo = String(input?.tipo || '').trim()
  const orden = Number(input?.orden)
  const requerido = Boolean(input?.requerido)
  const opciones = normalizeOptions(input?.opciones, tipo)
  const errors = []
  if (!nombre) errors.push('Falta el nombre del campo.')
  if (!FIELD_TYPES.has(tipo)) errors.push('El tipo tiene que ser texto, número, fecha, checkbox o selector.')
  if (!Number.isFinite(orden)) errors.push('El orden tiene que ser un número.')
  if (tipo === 'selector' && opciones.length === 0) errors.push('El selector necesita al menos una opción.')
  return {
    value: {
      nombre,
      tipo,
      orden: Number.isFinite(orden) ? orden : 0,
      requerido,
      opciones: tipo === 'selector' ? opciones : [],
      clave: String(input?.clave || '').trim(),
    },
    errors,
  }
}

function normalizeOptions(raw, tipo) {
  if (tipo !== 'selector') return []
  const list = Array.isArray(raw)
    ? raw
    : String(raw || '').split(',')
  const options = []
  const seen = new Set()
  for (const item of list) {
    const option = publicOption(item)
    if (!option || seen.has(option.value)) continue
    seen.add(option.value)
    options.push(option)
  }
  return options
}

function normalizeExtras(raw, fields) {
  const source = raw && typeof raw === 'object' ? raw : {}
  const extras = {}
  const errors = []
  for (const field of fields) {
    const value = source[field.id]
    if (field.tipo === 'checkbox') {
      extras[field.id] = Boolean(value)
      if (field.requerido && !extras[field.id]) errors.push(`Falta ${field.nombre}.`)
      continue
    }
    const text = value === undefined || value === null ? '' : String(value).trim()
    if (field.requerido && !text) errors.push(`Falta ${field.nombre}.`)
    if (field.tipo === 'numero') {
      if (!text) extras[field.id] = ''
      else if (Number.isNaN(Number(text))) errors.push(`${field.nombre} tiene que ser un número.`)
      else extras[field.id] = Number(text)
      continue
    }
    if (field.tipo === 'selector') {
      const allowed = (field.opciones || []).map((option) => option.value || option)
      if (text && !allowed.includes(text)) errors.push(`${field.nombre} no tiene esa opción.`)
      extras[field.id] = text
      continue
    }
    extras[field.id] = text
  }
  return { extras, errors }
}

async function attachExtras(body, value, errors) {
  if (!Object.prototype.hasOwnProperty.call(body || {}, 'extras')) return { value, errors }
  const fields = (await ClientField.find().sort({ orden: 1, nombre: 1 })).map(publicField)
  const result = normalizeExtras(body.extras, fields)
  const next = { ...value, extras: result.extras }
  for (const field of fields) {
    if (!field.clave || !Object.prototype.hasOwnProperty.call(result.extras, field.id)) continue
    next[field.clave] = result.extras[field.id]
  }
  return { value: next, errors: [...errors, ...result.errors] }
}

export const listClientFields = async (_req, res) => {
  const docs = await ClientField.find().sort({ orden: 1, nombre: 1 })
  res.json(docs.map(publicField))
}

export const createClientField = async (req, res) => {
  const { value, errors } = normalizeField(req.body)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })
  const doc = await ClientField.create(value)
  const saved = publicField(doc)
  const actor = await actorOf(req)
  await writeActivities([{
    action: 'create',
    entity: 'client-field',
    ticketId: '',
    ticketTitle: saved.nombre,
    summary: `Agregó el campo de cliente «${saved.nombre}» (${saved.tipo}, orden ${saved.orden}${saved.requerido ? ', requerido' : ''})`,
    ...actor,
    detail: saved,
  }])
  res.status(201).json(saved)
}

const BUILTIN_FIELDS = [
  { clave: 'tipo', nombre: 'Tipo', tipo: 'selector', orden: 1, requerido: true, opciones: [{ value: 'fisica', label: 'Persona física' }, { value: 'juridica', label: 'Persona jurídica' }] },
  { clave: 'nombre', nombre: 'Nombre', tipo: 'texto', orden: 2, requerido: false },
  { clave: 'apellido', nombre: 'Apellido', tipo: 'texto', orden: 3, requerido: false },
  { clave: 'documento', nombre: 'DNI o CUIT', tipo: 'texto', orden: 4, requerido: true },
  { clave: 'razonSocial', nombre: 'Razón social', tipo: 'texto', orden: 5, requerido: false },
  { clave: 'email', nombre: 'Mail', tipo: 'texto', orden: 6, requerido: false },
  { clave: 'telefono', nombre: 'Teléfono', tipo: 'texto', orden: 7, requerido: false },
  { clave: 'criticidad', nombre: 'Criticidad', tipo: 'selector', orden: 8, requerido: true, opciones: [{ value: 'alta', label: 'Alta' }, { value: 'media', label: 'Media' }, { value: 'baja', label: 'Baja' }] },
  { clave: 'poder', nombre: 'Poder', tipo: 'checkbox', orden: 9, requerido: false },
  { clave: 'patrocinio', nombre: 'Patrocinio', tipo: 'checkbox', orden: 10, requerido: false },
]

function builtinValue(client, field) {
  const value = client[field.clave]
  if (field.tipo === 'checkbox') return Boolean(value)
  return value === undefined || value === null ? '' : value
}

export const migrateClientFields = async (req, res) => {
  const existing = await ClientField.find({ clave: { $in: BUILTIN_FIELDS.map((field) => field.clave) } })
  const byClave = new Map(existing.map((doc) => [doc.clave, doc]))
  const fields = []
  for (const spec of BUILTIN_FIELDS) {
    let doc = byClave.get(spec.clave)
    if (!doc) doc = await ClientField.create({ ...spec, opciones: spec.opciones || [] })
    fields.push(doc)
  }

  const clients = await Client.find()
  for (const client of clients) {
    const extras = client.extras && typeof client.extras === 'object' ? { ...client.extras } : {}
    for (const field of fields) {
      extras[String(field._id)] = builtinValue(client, field)
    }
    client.extras = extras
    client.markModified('extras')
    await client.save()
  }

  const actor = await actorOf(req)
  await writeActivities([{
    action: 'update',
    entity: 'client-field',
    ticketId: '',
    ticketTitle: 'Campos de cliente',
    summary: `Migró los campos fijos de ${clients.length} clientes a campos configurables`,
    ...actor,
    detail: { clients: clients.length, fields: fields.map((field) => field.clave) },
  }])
  res.json({
    fields: fields.map(publicField),
    clients: clients.length,
  })
}

export const updateClientField = async (req, res) => {
  const current = await ClientField.findById(req.params.id)
  if (!current) return res.status(404).json({ message: 'No se encontró el campo.' })
  const currentPublic = publicField(current)
  const incoming = { ...currentPublic, ...req.body }
  if (current.clave) {
    incoming.clave = current.clave
    incoming.tipo = current.tipo
    incoming.opciones = currentPublic.opciones
  } else if (Array.isArray(req.body?.opciones)) {
    incoming.opciones = req.body.opciones.map((item) => item?.value || item).join(',')
  }
  const { value, errors } = normalizeField(incoming)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })
  const before = publicField(current)
  Object.assign(current, value)
  await current.save()
  const after = publicField(current)
  const actor = await actorOf(req)
  const fieldChanges = []
  const base = { entity: 'client-field', ticketId: '', ticketTitle: after.nombre, ...actor }
  if (before.nombre !== after.nombre) {
    fieldChanges.push({ ...base, action: 'update', summary: `Actualizó el nombre del campo: «${before.nombre}» → «${after.nombre}»`, detail: { before, after } })
  }
  if (before.tipo !== after.tipo) {
    fieldChanges.push({ ...base, action: 'update', summary: `Actualizó el tipo del campo «${after.nombre}»: ${before.tipo} → ${after.tipo}`, detail: { before, after } })
  }
  if (before.orden !== after.orden) {
    fieldChanges.push({ ...base, action: 'update', summary: `Actualizó el orden del campo «${after.nombre}»: ${before.orden} → ${after.orden}`, detail: { before, after } })
  }
  if (before.requerido !== after.requerido) {
    fieldChanges.push({
      ...base,
      action: 'update',
      summary: after.requerido ? `Marcó como requerido el campo «${after.nombre}»` : `Sacó el requerido del campo «${after.nombre}»`,
      detail: { before, after },
    })
  }
  if (JSON.stringify(before.opciones) !== JSON.stringify(after.opciones)) {
    fieldChanges.push({ ...base, action: 'update', summary: `Actualizó las opciones del campo «${after.nombre}»`, detail: { before: before.opciones, after: after.opciones } })
  }
  await writeActivities(fieldChanges)
  res.json(after)
}

export const deleteClientField = async (req, res) => {
  const current = await ClientField.findById(req.params.id)
  if (!current) return res.status(404).json({ message: 'No se encontró el campo.' })
  const saved = publicField(current)
  await current.deleteOne()
  const actor = await actorOf(req)
  await writeActivities([{
    action: 'delete',
    entity: 'client-field',
    ticketId: '',
    ticketTitle: saved.nombre,
    summary: `Eliminó el campo de cliente «${saved.nombre}»`,
    ...actor,
    detail: saved,
  }])
  res.json(saved)
}

export const createClient = async (req, res) => {
  const normalized = normalizeClient(req.body)
  const { value, errors } = await attachExtras(req.body, normalized.value, normalized.errors)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })
  const taken = await Client.findOne({ documento: value.documento })
  if (taken) return res.status(409).json({ message: 'Ya hay un cliente con ese DNI o CUIT.' })
  const doc = await Client.create(value)
  const actor = await actorOf(req)
  const saved = publicClient(doc)
  const fields = (await ClientField.find()).map(publicField)
  await writeActivities([
    {
      action: 'create',
      entity: 'client',
      ticketId: '',
      ticketTitle: clientName(saved),
      summary: `Agregó el cliente «${clientName(saved)}»`,
      ...actor,
      detail: saved,
    },
    ...extraChangeEntries({ extras: {} }, saved, actor, fields).map((entry) => ({ ...entry, action: 'create' })),
  ])
  res.status(201).json(saved)
}

export const updateClient = async (req, res) => {
  const current = await Client.findById(req.params.id)
  if (!current) return res.status(404).json({ message: 'No se encontró el cliente.' })
  const normalized = normalizeClient({ ...publicClient(current), ...req.body })
  const { value, errors } = await attachExtras(req.body, normalized.value, normalized.errors)
  if (errors.length) return res.status(400).json({ message: errors.join(' ') })
  const taken = await Client.findOne({ documento: value.documento, _id: { $ne: current._id } })
  if (taken) return res.status(409).json({ message: 'Ya hay un cliente con ese DNI o CUIT.' })
  const before = publicClient(current)
  Object.assign(current, value)
  if (value.extras) current.markModified('extras')
  await current.save()
  const after = publicClient(current)
  const actor = await actorOf(req)
  const fields = (await ClientField.find()).map(publicField)
  await writeActivities(changeEntries(before, after, actor, fields))
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
  const fields = (await ClientField.find()).map(publicField)
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
    const changes = changeEntries(before, after, actor, fields).map((entry) => ({
      ...entry,
      summary: `${entry.summary} (Excel)`,
    }))
    if (changes.length) updated += 1
    activities.push(...changes)
  }

  await writeActivities(activities)
  res.json({ created, updated, errors })
}

import * as XLSX from 'xlsx'

const HEADER_FIELDS = {
  nombre: 'nombre',
  name: 'nombre',
  apellido: 'apellido',
  lastname: 'apellido',
  dni: 'documento',
  cuit: 'documento',
  cuil: 'documento',
  documento: 'documento',
  dnicuit: 'documento',
  dnio: 'documento',
  dniocuit: 'documento',
  mail: 'email',
  email: 'email',
  correo: 'email',
  telefono: 'telefono',
  numerodetelefono: 'telefono',
  tel: 'telefono',
  celular: 'telefono',
  phone: 'telefono',
  razonsocial: 'razonSocial',
  razon: 'razonSocial',
  empresa: 'razonSocial',
  tipo: 'tipo',
  persona: 'tipo',
  personeria: 'tipo',
  tipopersona: 'tipo',
  poder: 'poder',
  patrocinio: 'patrocinio',
  criticidad: 'criticidad',
  nivel: 'criticidad',
  niveldecriticidad: 'criticidad',
}

function headerKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function digits(value) {
  return String(value || '').replace(/\D/g, '')
}

export function clientName(client) {
  if (client?.tipo === 'juridica') return client.razonSocial || client.documento || 'Sin razón social'
  const person = `${client?.nombre || ''} ${client?.apellido || ''}`.trim()
  return person || client?.razonSocial || client?.documento || 'Sin nombre'
}

export function normalizeTipo(value) {
  const text = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
  if (['fisica', 'pf', 'persona fisica', 'particular', 'individual'].includes(text)) return 'fisica'
  if (['juridica', 'pj', 'persona juridica', 'empresa', 'sociedad'].includes(text)) return 'juridica'
  return ''
}

export function normalizeCriticidad(value) {
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

export function validateClient(input) {
  const tipo = normalizeTipo(input?.tipo)
  const nombre = String(input?.nombre || '').trim()
  const apellido = String(input?.apellido || '').trim()
  const razonSocial = String(input?.razonSocial || '').trim()
  const email = String(input?.email || '').trim().toLowerCase()
  const telefono = String(input?.telefono || '').trim()
  const documento = digits(input?.documento)
  const criticidad = normalizeCriticidad(input?.criticidad) || 'media'
  const errors = []
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('El mail no es válido.')
  if (telefono && digits(telefono).length < 6) errors.push('El teléfono tiene que tener al menos 6 dígitos.')
  if (!tipo) errors.push('El tipo tiene que ser persona física o jurídica.')
  if (!documento) errors.push('Falta el DNI o el CUIT.')
  else if (![7, 8, 11].includes(documento.length)) errors.push('El DNI tiene 7 u 8 dígitos y el CUIT 11.')
  if (tipo === 'fisica' && !nombre) errors.push('Falta el nombre.')
  if (tipo === 'fisica' && !apellido) errors.push('Falta el apellido.')
  if (tipo === 'juridica' && !razonSocial) errors.push('Falta la razón social.')
  const value = { tipo, nombre, apellido, documento, razonSocial, email, telefono, criticidad }
  if (input?.poder !== undefined) value.poder = Boolean(input.poder)
  if (input?.patrocinio !== undefined) value.patrocinio = Boolean(input.patrocinio)
  return { value, errors }
}

function yesNo(value) {
  return value ? 'Sí' : 'No'
}

function tipoLabel(tipo) {
  return tipo === 'juridica' ? 'Jurídica' : 'Física'
}

function criticidadLabel(value) {
  if (value === 'alta') return 'Alta'
  if (value === 'baja') return 'Baja'
  return 'Media'
}

function extraCell(field, client) {
  const value = client.extras?.[field.id]
  if (field.tipo === 'checkbox') return yesNo(value)
  if (field.tipo === 'selector') {
    const option = (field.opciones || []).find((item) => (item?.value || item) === value)
    return option?.label || value || ''
  }
  return value ?? ''
}

export function downloadClientsExcel(clients, fields = []) {
  const extras = (fields || []).filter((field) => !field.clave)
  const headers = ['Nombre', 'Apellido', 'DNI o CUIT', 'Razón social', 'Mail', 'Teléfono', 'Tipo', 'Criticidad', 'Poder', 'Patrocinio', ...extras.map((field) => field.nombre)]
  const rows = (clients || []).map((client) => [
    client.nombre || '',
    client.apellido || '',
    client.documento || '',
    client.razonSocial || '',
    client.email || '',
    client.telefono || '',
    tipoLabel(client.tipo),
    criticidadLabel(client.criticidad),
    yesNo(client.poder),
    yesNo(client.patrocinio),
    ...extras.map((field) => extraCell(field, client)),
  ])
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  sheet['!cols'] = headers.map((header) => ({ wch: Math.max(14, String(header).length + 2) }))
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Clientes')
  XLSX.writeFile(book, 'clientes.xlsx')
}

export function downloadClientTemplate() {
  const rows = [
    ['Nombre', 'Apellido', 'DNI o CUIT', 'Razón social', 'Mail', 'Teléfono', 'Tipo', 'Criticidad', 'Poder', 'Patrocinio'],
    ['Ana', 'Pérez', '30123456', '', 'ana@correo.com', '11 5555 0101', 'Física', 'Baja', 'Sí', 'No'],
    ['', '', '30712345678', 'Estudio Norte SA', 'contacto@estudionorte.com', '11 4444 0202', 'Jurídica', 'Alta', 'Sí', 'Sí'],
  ]
  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 16 }, { wch: 28 }, { wch: 28 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 14 }]
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Clientes')
  XLSX.writeFile(book, 'modelo-clientes.xlsx')
}

export function parseClientWorkbook(buffer) {
  const book = XLSX.read(buffer, { type: 'array' })
  const sheet = book.Sheets[book.SheetNames[0]]
  if (!sheet) return { rows: [], error: 'El archivo no tiene hojas.' }
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false })
  const headerIndex = matrix.findIndex((row) => (row || []).some((cell) => HEADER_FIELDS[headerKey(cell)]))
  if (headerIndex < 0) {
    return { rows: [], error: 'No encontré las columnas. Usá el modelo: Nombre, Apellido, DNI o CUIT, Razón social, Mail, Teléfono, Tipo y Criticidad.' }
  }

  const columns = {}
  matrix[headerIndex].forEach((cell, index) => {
    const field = HEADER_FIELDS[headerKey(cell)]
    if (field && columns[field] === undefined) columns[field] = index
  })

  const rows = []
  const seen = new Set()
  for (let index = headerIndex + 1; index < matrix.length; index += 1) {
    const line = matrix[index] || []
    const read = (field) => String(line[columns[field]] ?? '').trim()
    const blank = ['nombre', 'apellido', 'documento', 'razonSocial', 'email', 'telefono', 'tipo', 'criticidad']
      .every((field) => columns[field] === undefined || !read(field))
    if (blank) continue
    const tipo = normalizeTipo(read('tipo')) || (read('razonSocial') && !read('nombre') ? 'juridica' : 'fisica')
    const flag = (field) => ['si', 's', '1', 'true', 'x', 'yes'].includes(
      read(field).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(),
    )
    const { value, errors } = validateClient({
      tipo,
      nombre: read('nombre'),
      apellido: read('apellido'),
      documento: read('documento'),
      razonSocial: read('razonSocial'),
      email: read('email'),
      telefono: read('telefono'),
      criticidad: read('criticidad') || 'media',
      ...(columns.poder !== undefined ? { poder: flag('poder') } : {}),
      ...(columns.patrocinio !== undefined ? { patrocinio: flag('patrocinio') } : {}),
    })
    if (value.documento && seen.has(value.documento)) errors.push('Ese DNI o CUIT está repetido en el archivo.')
    if (value.documento) seen.add(value.documento)
    rows.push({ row: index + 1, ...value, errors })
  }

  if (!rows.length) return { rows: [], error: 'El archivo no tiene clientes para importar.' }
  return { rows, error: null }
}

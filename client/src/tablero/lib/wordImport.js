import mammoth from 'mammoth'
import { DEFAULT_COLUMN_ID, DEFAULT_PRIORITY } from '../constants/columns.js'

const MIN_COLUMNS = 7
const MAX_CARATULA_LENGTH = 70

function getCellText(cell) {
  if (!cell) return ''
  return (cell.textContent || '').replace(/\s+/g, ' ').trim()
}

function getCellParagraphText(cell) {
  if (!cell) return ''
  const paragraphs = Array.from(cell.querySelectorAll('p'))
  if (paragraphs.length === 0) {
    return getCellText(cell)
  }
  return paragraphs
    .map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
}

function parseDueDate(value) {
  const trimmed = (value || '').trim()
  if (!trimmed) return { dueDate: '', warning: null }

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!match) {
    return {
      dueDate: trimmed,
      warning: `Fecha límite "${trimmed}" no tiene formato dd/mm/aaaa, se guardó como texto.`,
    }
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  const isValid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day

  if (!isValid) {
    return {
      dueDate: trimmed,
      warning: `Fecha límite "${trimmed}" no es una fecha válida, se guardó como texto.`,
    }
  }

  const iso = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return { dueDate: iso, warning: null }
}

function buildTitle(expediente, caratula) {
  if (!caratula) return expediente
  const truncated =
    caratula.length > MAX_CARATULA_LENGTH ? `${caratula.slice(0, MAX_CARATULA_LENGTH)}...` : caratula
  return `${expediente} — ${truncated}`
}

function buildDescription(expediente, juzgado, caratula, novedad) {
  return [
    `Expediente: ${expediente}`,
    `Juzgado: ${juzgado || '-'}`,
    `Carátula: ${caratula}`,
    '',
    novedad,
  ].join('\n')
}

export async function parseWordDocx(file) {
  if (!file.name.toLowerCase().endsWith('.docx')) {
    throw new Error('El archivo seleccionado no es un .docx válido.')
  }

  let html
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.convertToHtml({ arrayBuffer })
    html = result.value
  } catch {
    throw new Error('El archivo seleccionado no es un .docx válido.')
  }

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const table = doc.querySelector('table')
  if (!table) {
    throw new Error('El Word no contiene una tabla de tickets válida.')
  }

  const rows = Array.from(table.querySelectorAll('tr'))
  if (rows.length === 0) {
    throw new Error('El Word no contiene una tabla de tickets válida.')
  }

  const firstRowCells = rows[0].querySelectorAll('td, th')
  if (firstRowCells.length < MIN_COLUMNS) {
    throw new Error(
      'El Word no tiene el formato esperado de lista de expedientes (se esperan al menos 7 columnas).',
    )
  }

  const tickets = []
  const warnings = []
  let skippedNoTitle = 0

  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td, th'))

    const expediente = getCellText(cells[2])
    if (!expediente) {
      skippedNoTitle++
      continue
    }

    const caratula = getCellText(cells[3])
    const juzgadoRaw = getCellText(cells[4])
    const juzgado = juzgadoRaw === '-' ? '' : juzgadoRaw
    const novedad = getCellParagraphText(cells[5])
    const { dueDate, warning } = parseDueDate(getCellText(cells[6]))
    if (warning) warnings.push(warning)

    tickets.push({
      title: buildTitle(expediente, caratula),
      description: buildDescription(expediente, juzgado, caratula, novedad),
      status: DEFAULT_COLUMN_ID,
      assignee: '',
      priority: DEFAULT_PRIORITY,
      labels: [],
      dueDate,
    })
  }

  return { tickets, skippedNoTitle, warnings }
}

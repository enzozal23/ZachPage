import AppLog from '../models/log.model.js'

const SECRET_KEYS = ['pass', 'password', 'gmail_pass', 'authorization', 'token']

function clean(value) {
  if (!value || typeof value !== 'object') return value
  const copy = Array.isArray(value) ? [...value] : { ...value }
  for (const key of Object.keys(copy)) {
    if (SECRET_KEYS.includes(key.toLowerCase())) {
      copy[key] = '[oculto]'
    }
  }
  return copy
}

async function write(level, message, detail) {
  const line = `[${level}] ${message}`
  if (level === 'error') console.error(line, detail || '')
  else console.log(line, detail || '')

  try {
    await AppLog.create({ level, message, detail: clean(detail) })
  } catch (error) {
    console.error('[logs] no se pudo guardar', error.message)
  }
}

export function logInfo(message, detail) {
  return write('info', message, detail)
}

export function logError(message, error, detail) {
  return write('error', message, {
    ...detail,
    error: error?.message,
    code: error?.code,
    command: error?.command,
    response: typeof error?.response === 'string' ? error.response : error?.responseCode,
  })
}

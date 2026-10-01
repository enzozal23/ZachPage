import SessionLog from '../models/sessionLog.model.js'

export async function writeSessionLog(entry) {
  try {
    await SessionLog.create({
      event: entry.event,
      email: String(entry.email || '').trim(),
      username: String(entry.username || '').trim(),
      userId: String(entry.userId || ''),
      ip: String(entry.ip || ''),
      reason: String(entry.reason || ''),
    })
  } catch (error) {
    console.error('[session] no se pudo guardar', error.message)
  }
}

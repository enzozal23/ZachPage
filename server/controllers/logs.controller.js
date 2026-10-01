import AppLog from '../models/log.model.js'
import MailLog from '../models/mailLog.model.js'
import SessionLog from '../models/sessionLog.model.js'

export const getLogs = async (req, res) => {
  try {
    const level = req.query.level
    const filter = level === 'info' || level === 'error' ? { level } : {}
    const logs = await AppLog.find(filter).sort({ createdAt: -1 }).limit(200)
    res.json(logs)
  } catch (error) {
    console.error('[logs] sistema', error.message)
    res.status(500).json({ message: 'No se pudieron cargar los logs de sistema.' })
  }
}

export const getMailLogs = async (_req, res) => {
  try {
    const logs = await MailLog.find().sort({ createdAt: -1 }).limit(200)
    res.json(logs)
  } catch (error) {
    console.error('[logs] mails', error.message)
    res.status(500).json({ message: 'No se pudieron cargar los logs de mails.' })
  }
}

export const getSessionLogs = async (_req, res) => {
  try {
    const logs = await SessionLog.find().sort({ createdAt: -1 }).limit(200)
    res.json(logs)
  } catch (error) {
    console.error('[logs] sesión', error.message)
    res.status(500).json({ message: 'No se pudieron cargar los logs de sesión.' })
  }
}

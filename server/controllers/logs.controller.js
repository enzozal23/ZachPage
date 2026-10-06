import os from 'os'
import AppLog from '../models/log.model.js'
import MailLog from '../models/mailLog.model.js'
import SessionLog from '../models/sessionLog.model.js'

export const getHost = (_req, res) => {
  const total = os.totalmem()
  const free = os.freemem()
  const memory = process.memoryUsage()
  const cpus = os.cpus()
  res.json({
    hostname: os.hostname(),
    platform: os.platform(),
    type: os.type(),
    release: os.release(),
    arch: os.arch(),
    uptime: os.uptime(),
    processUptime: process.uptime(),
    load: os.loadavg(),
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model || '',
    memory: { total, free, used: Math.max(0, total - free) },
    process: {
      rss: memory.rss,
      heapTotal: memory.heapTotal,
      heapUsed: memory.heapUsed,
      external: memory.external,
      node: process.version,
      pid: process.pid,
    },
    render: Boolean(process.env.RENDER),
    service: process.env.RENDER_SERVICE_NAME || '',
    region: process.env.RENDER_REGION || '',
    instance: process.env.RENDER_INSTANCE_ID || '',
  })
}

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

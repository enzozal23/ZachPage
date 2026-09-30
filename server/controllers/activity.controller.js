import ActivityLog from '../models/activity.model.js'

export const listActivities = async (req, res) => {
  try {
    const filter = {}
    const action = String(req.query.action || '').trim().toLowerCase()
    if (action === 'create' || action === 'update' || action === 'delete') {
      filter.action = action
    }

    const ticketId = String(req.query.ticketId || '').trim()
    if (ticketId) filter.ticketId = ticketId

    const from = String(req.query.from || '').trim()
    const to = String(req.query.to || '').trim()
    if (from || to) {
      filter.createdAt = {}
      if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000-03:00`)
      if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999-03:00`)
    }

    const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(500)
    res.json(logs)
  } catch (error) {
    console.error('[activity] list failed', error.message)
    res.status(500).json({ message: 'No se pudo cargar el monitoreo.' })
  }
}

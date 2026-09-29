import AppLog from '../models/log.model.js'

export const getLogs = async (req, res) => {
  const level = req.query.level
  const filter = level === 'info' || level === 'error' ? { level } : {}
  const logs = await AppLog.find(filter).sort({ createdAt: -1 }).limit(200)
  res.json(logs)
}

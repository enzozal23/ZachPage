export function cronSecretRequired(req, res, next) {
  const expected = String(process.env.CRON_SECRET || '').trim()
  if (!expected) {
    return res.status(503).json({ message: 'CRON_SECRET no está configurado en el servidor.' })
  }

  const header = String(req.headers['x-cron-secret'] || '').trim()
  const bearer = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '').trim()
  const provided = header || bearer

  if (!provided || provided !== expected) {
    return res.status(401).json({ message: 'No autorizado.' })
  }

  next()
}

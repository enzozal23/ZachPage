export function appRequestRequired(req, res, next) {
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next()
    if (req.originalUrl.split('?')[0] === '/api/kanban/reminders/run') return next()
    if (req.get('x-lexora-request') !== '1') {
        return res.status(403).json({ message: 'Falta el encabezado de la aplicación.' })
    }
    next()
}

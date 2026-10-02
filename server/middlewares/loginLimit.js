import rateLimit, { ipKeyGenerator } from 'express-rate-limit'

export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
        const email = String(req.body?.email || '').trim().toLowerCase()
        return `${ipKeyGenerator(String(req.ip || ''))}:${email}`
    },
    message: { message: 'Demasiados intentos. Probá de nuevo en 15 minutos.' },
})

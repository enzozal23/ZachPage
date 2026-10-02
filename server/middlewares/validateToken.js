import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import User from '../models/user.models.js'

dotenv.config()

export function readToken(req) {
    if (req.cookies?.token) return req.cookies.token
    const header = req.headers.authorization || ''
    if (header.startsWith('Bearer ')) return header.slice(7).trim()
    return null
}

export const authRequired = async (req, res, next) => {
    const token = readToken(req)
    if (!token) return res.status(401).json({ message: 'No autorizado.' })

    try {
        const payload = jwt.verify(token, process.env.TOKEN_SECRET)
        const user = await User.findById(payload.id).select('role tokenVersion')
        if (!user) return res.status(401).json({ message: 'No autorizado.' })
        if (Number(user.tokenVersion || 0) !== Number(payload.tv || 0)) {
            return res.status(401).json({ message: 'No autorizado.' })
        }
        req.user = { id: String(user._id), role: user.role || 'user' }
        next()
    } catch {
        return res.status(401).json({ message: 'No autorizado.' })
    }
}

export function adminRequired(req, res, next) {
    if (req.user?.role !== 'admin' && req.user?.role !== '0623') {
        return res.status(403).json({ message: 'No tenés permiso para esto.' })
    }
    next()
}

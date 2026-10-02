import brcypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js';
import User from "../models/user.models.js";
import Kanban from '../models/kanban.model.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { readToken } from '../middlewares/validateToken.js';
import { requestIp } from '../libs/activityLog.js';
import { writeSessionLog } from '../libs/sessionLog.js';
import { permisosDe } from '../libs/permisos.js';

function cookieOptions() {
    const production = Boolean(process.env.RENDER) || process.env.NODE_ENV === 'production'
    return {
        httpOnly: true,
        secure: production,
        sameSite: production ? 'none' : 'lax',
        path: '/',
        maxAge: 24 * 60 * 60 * 1000,
    }
}

function fail(res, error) {
    console.error(error)
    res.status(500).json({ message: 'No se pudo completar la operación.' })
}

function publicSession(user) {
    return {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}


dotenv.config()

export const login = async (req, res) => {
    const { email, password } = req.body
    const ip = requestIp(req)

    try {
        const userFound = await User.findOne({ email });//busca en la base de dato por email y devuelve booleano

        if (!userFound) {
            await writeSessionLog({ event: 'failed', email, ip, reason: 'Usuario inexistente' })
            return res.status(400).json({ message: 'usuario o contraseña incorrecto' })
        }

        const isMatch = await brcypt.compare(password, userFound.password)

        if (!isMatch) {
            await writeSessionLog({
                event: 'failed',
                email: userFound.email,
                username: userFound.username,
                userId: userFound._id,
                ip,
                reason: 'Contraseña incorrecta',
            })
            return res.status(400).json({ message: "usuario o contraseña incorrecto" })
        }

        await writeSessionLog({
            event: 'login',
            email: userFound.email,
            username: userFound.username,
            userId: userFound._id,
            ip,
        })

        const token = await createAccessToken({ id: userFound._id, tv: Number(userFound.tokenVersion || 0) });
        res.cookie('token', token, cookieOptions())
        res.json({ ...publicSession(userFound), permisos: await permisosDe(userFound.role || 'user') })
    } catch (error) {
        fail(res, error)
    }
}
export const logout = async (req, res) => {
    const ip = requestIp(req)
    const entry = { event: 'logout', ip }
    try {
        const token = readToken(req)
        if (token) {
            const payload = jwt.verify(token, process.env.TOKEN_SECRET)
            const user = await User.findById(payload.id).select('username email')
            if (user) {
                entry.email = user.email
                entry.username = user.username
                entry.userId = user._id
            }
        }
    } catch {
        // la sesión se cierra igual si el token ya no sirve
    }
    await writeSessionLog(entry)
    const options = cookieOptions()
    res.clearCookie('token', options)
    res.cookie('token', '', { ...options, expires: new Date(0), maxAge: 0 })
    res.sendStatus(200)
}
export const profile = async (req, res) => {

    const userFound = await User.findById(req.user.id)
    if (!userFound) return res.status(400).json({ message: 'usuario no encontrado' })
    return res.json({ ...publicSession(userFound), permisos: await permisosDe(userFound.role || 'user') })
}

function publicUser(user) {
    return {
        id: user._id,
        username: user.username || '',
        email: user.email,
        role: user.role || 'user',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }
}

function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sameName(left, right) {
    return String(left || '').trim().toLowerCase() === String(right || '').trim().toLowerCase()
}

async function emailTaken(email, exceptId) {
    const query = { email: new RegExp(`^${escapeRegex(email)}$`, 'i') }
    if (exceptId) query._id = { $ne: exceptId }
    return User.findOne(query)
}

async function renameMentions(previous, next) {
    const pairs = []
    if (previous.username && next.username && !sameName(previous.username, next.username)) {
        pairs.push([previous.username, next.username])
    }
    if (previous.email && next.email && !sameName(previous.email, next.email)) {
        pairs.push([previous.email, next.email])
    }
    if (!pairs.length) return

    const docs = await Kanban.find()
    for (const doc of docs) {
        let changed = false
        for (const ticket of doc.tickets || []) {
            for (const [from, to] of pairs) {
                if (sameName(ticket.assignee, from)) {
                    ticket.assignee = to
                    changed = true
                }
                for (const field of ['assignees', 'followers']) {
                    if (!Array.isArray(ticket[field])) continue
                    ticket[field] = ticket[field].map((name) => {
                        if (!sameName(name, from)) return name
                        changed = true
                        return to
                    })
                }
                for (const comment of ticket.comments || []) {
                    if (sameName(comment.author, from)) {
                        comment.author = to
                        changed = true
                    }
                }
            }
        }
        if (changed) {
            doc.markModified('tickets')
            await doc.save()
        }
    }
}

export const listAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('username email role createdAt updatedAt').sort({ username: 1, email: 1 })
        res.json(users.map(publicUser))
    } catch (error) {
        fail(res, error)
    }
}

export const createUser = async (req, res) => {
    const username = String(req.body.username || '').trim()
    const email = String(req.body.email || '').trim()
    try {
        if (await emailTaken(email)) return res.status(400).json({ message: 'Ese mail ya está en uso.' })
        const passwordHash = await brcypt.hash(req.body.password, 10)
        const role = req.body.role === 'admin' ? 'admin' : 'user'
        const user = await User.create({ username, email, password: passwordHash, role, tokenVersion: 0 })
        res.status(201).json(publicUser(user))
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Ese mail ya está en uso.' })
        fail(res, error)
    }
}

export const updateUser = async (req, res) => {
    const username = String(req.body.username || '').trim()
    const email = String(req.body.email || '').trim()
    const password = String(req.body.password || '')
    try {
        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' })
        if (await emailTaken(email, user._id)) return res.status(400).json({ message: 'Ese mail ya está en uso.' })
        const previous = { username: user.username || '', email: user.email || '' }
        const isSelf = String(user._id) === String(req.user?.id)
        if (password) {
            if (isSelf) {
                const matches = await brcypt.compare(String(req.body.currentPassword || ''), user.password)
                if (!matches) return res.status(400).json({ message: 'La contraseña actual no coincide.' })
            }
            user.password = await brcypt.hash(password, 10)
            user.tokenVersion = Number(user.tokenVersion || 0) + 1
        }
        if (req.body.role === 'admin' || req.body.role === 'user') {
            if (req.body.role === 'user' && user.role === 'admin') {
                const others = await User.countDocuments({ role: 'admin', _id: { $ne: user._id } })
                if (!others) return res.status(400).json({ message: 'Tiene que quedar al menos un administrador.' })
            }
            user.role = req.body.role
        }
        user.username = username
        user.email = email
        await user.save()
        try {
            await renameMentions(previous, { username, email })
        } catch (error) {
            console.error('No se pudieron actualizar las menciones del usuario', error)
        }
        if (isSelf && password) {
            const token = await createAccessToken({ id: user._id, tv: Number(user.tokenVersion || 0) })
            res.cookie('token', token, cookieOptions())
        }
        res.json(publicUser(user))
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Ese mail ya está en uso.' })
        fail(res, error)
    }
}

export const deleteUser = async (req, res) => {
    try {
        if (String(req.params.id) === String(req.user?.id)) {
            return res.status(400).json({ message: 'No podés eliminar tu propio usuario.' })
        }
        const user = await User.findById(req.params.id)
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' })
        if (user.role === 'admin') {
            const others = await User.countDocuments({ role: 'admin', _id: { $ne: user._id } })
            if (!others) return res.status(400).json({ message: 'Tiene que quedar al menos un administrador.' })
        }
        await user.deleteOne()
        res.sendStatus(204)
    } catch (error) {
        fail(res, error)
    }
}

export const listUsers = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim()
        if (q.length < 2) return res.json([])
        const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const match = new RegExp(safe, 'i')
        const users = await User.find({
            $or: [{ username: match }, { email: match }],
        }).select('username email').sort({ username: 1 }).limit(8)
        res.json(users.map((user) => ({
            id: user._id,
            username: user.username || '',
            email: user.email,
        })))
    } catch (error) {
        fail(res, error)
    }
}

export const verifyToken = async (req, res) => {
    const token = readToken(req)
    if (!token) return res.status(401).json({ message: 'No autorizado.' })

    try {
        const payload = jwt.verify(token, process.env.TOKEN_SECRET)
        const userFound = await User.findById(payload.id)
        if (!userFound) return res.status(401).json({ message: 'No autorizado.' })
        if (Number(userFound.tokenVersion || 0) !== Number(payload.tv || 0)) {
            return res.status(401).json({ message: 'No autorizado.' })
        }
        res.cookie('token', token, cookieOptions())
        return res.json({ ...publicSession(userFound), permisos: await permisosDe(userFound.role || 'user') })
    } catch {
        return res.status(401).json({ message: 'No autorizado.' })
    }
}

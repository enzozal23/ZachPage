import brcypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js';
import User from "../models/user.models.js";
import Kanban from '../models/kanban.model.js'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { readToken } from '../middlewares/validateToken.js';
import { requestIp } from '../libs/activityLog.js';
import { writeSessionLog } from '../libs/sessionLog.js';

const cookieOptions = {
    sameSite: 'none',
    secure: true,
    path: '/',
}


dotenv.config()

export const register = async (req, res) => {
    const { email, password, username } = req.body

    try {
        const userFound = await User.findOne({ email })
        if (userFound) return res.status(400).json(['el correo ya esta en uso'])



        const passwordHash = await brcypt.hash(password, 10)

        const newUser = new User({
            username,
            email,
            password: passwordHash
        })
        const userSaved = await newUser.save()
        const token = await createAccessToken({ id: userSaved._id });
        res.cookie('token', token, cookieOptions)
        res.json({
            id: userSaved._id,
            username: userSaved.username,
            email: userSaved.email,
            createdAt: userSaved.createdAt,
            updatedAt: userSaved.updatedAt,
            token,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }

}
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

        const token = await createAccessToken({ id: userFound._id });
        res.cookie('token', token, cookieOptions)
        res.json({
            id: userFound._id,
            username: userFound.username,
            email: userFound.email,
            createdAt: userFound.createdAt,
            updatedAt: userFound.updatedAt,
            token,
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
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
    res.cookie('token', '', {
        ...cookieOptions,
        expires: new Date(0),
        maxAge: 0,
    })
    res.clearCookie('token', cookieOptions)
    res.clearCookie('token', { sameSite: 'none', secure: true })
    res.sendStatus(200)
}
export const profile = async (req, res) => {

    const userFound = await User.findById(req.user.id)
    if (!userFound) return res.status(400).json({ message: 'usuario no encontrado' })
    return res.json({
        id: userFound._id,
        username: userFound.username,
        email: userFound.email,
        createdAt: userFound.createdAt,
        updatedAt: userFound.updatedAt
    })
}

function publicUser(user) {
    return {
        id: user._id,
        username: user.username || '',
        email: user.email,
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
        const users = await User.find().select('username email createdAt updatedAt').sort({ username: 1, email: 1 })
        res.json(users.map(publicUser))
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

export const createUser = async (req, res) => {
    const username = String(req.body.username || '').trim()
    const email = String(req.body.email || '').trim()
    try {
        if (await emailTaken(email)) return res.status(400).json({ message: 'Ese mail ya está en uso.' })
        const passwordHash = await brcypt.hash(req.body.password, 10)
        const user = await User.create({ username, email, password: passwordHash })
        res.status(201).json(publicUser(user))
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Ese mail ya está en uso.' })
        res.status(500).json({ message: error.message })
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
        user.username = username
        user.email = email
        if (password) user.password = await brcypt.hash(password, 10)
        await user.save()
        try {
            await renameMentions(previous, { username, email })
        } catch (error) {
            console.error('No se pudieron actualizar las menciones del usuario', error)
        }
        res.json(publicUser(user))
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: 'Ese mail ya está en uso.' })
        res.status(500).json({ message: error.message })
    }
}

export const deleteUser = async (req, res) => {
    try {
        if (String(req.params.id) === String(req.user?.id)) {
            return res.status(400).json({ message: 'No podés eliminar tu propio usuario.' })
        }
        const user = await User.findByIdAndDelete(req.params.id)
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' })
        res.sendStatus(204)
    } catch (error) {
        res.status(500).json({ message: error.message })
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
        res.status(500).json({ message: error.message })
    }
}

export const verifyToken = async (req, res) => {
    const token = readToken(req)
    if (!token) return res.status(401).json({ message: "unauthorized no token" });

    jwt.verify(token, process.env.TOKEN_SECRET, async (error, user) => {
        if (error) return res.status(401).json({ message: "unauthorized" })

        const userFound = await User.findById(user.id)

        if (!userFound) return res.status(401).json({ message: "unauthorized no user" });
        return res.json({
            id: userFound._id,
            username: userFound.username,
            email: userFound.email,
        })
    })

}

import brcypt from 'bcryptjs'
import { createAccessToken } from '../libs/jwt.js';
import User from "../models/user.models.js";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import userModels from '../models/user.models.js';


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
        res.cookie('token', token)
        res.json({
            id: userSaved._id,
            username: userSaved.username,
            email: userSaved.email,
            createdAt: userSaved.createdAt,
            updatedAt: userSaved.updatedAt
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }

}
export const login = async (req, res) => {
    const { email, password } = req.body

    try {
        const userFound = await User.findOne({ email });//busca en la base de dato por email y devuelve booleano

        if (!userFound) return res.status(400).json({ message: 'usuario o contraseña incorrecto' })

        const isMatch = await brcypt.compare(password, userFound.password)

        if (!isMatch) return res.status(400).json({ message: "usuario o contraseña incorrecto" })





        const token = await createAccessToken({ id: userFound._id });
        res.cookie('token', token)
        res.json({
            id: userFound._id,
            username: userFound.username,
            email: userFound.email,
            createdAt: userFound.createdAt,
            updatedAt: userFound.updatedAt
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
export const logout = (req, res) => {
    res.cookie("token", "",
        {
            expires: new Date(0)
        })
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

export const verifyToken = async (req, res) => {
    const { token } = req.cookies
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

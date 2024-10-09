import jwt from 'jsonwebtoken'
import dotenv from "dotenv"

dotenv.config()
export const authRequired = (req, res, next) => {

    const { token } = req.cookies
    if (!token) return res.status(401).json({ message: "unauthorized no token" })


    jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) return res.status(401).json({ message: "invalid token" });
        console.log(user)
        req.user = user
        next()
    })

}


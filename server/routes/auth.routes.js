import { Router } from "express";
import { createUser, deleteUser, listAllUsers, listUsers, login, logout, profile, register, updateUser, verifyToken } from "../controllers/auth.controller.js";
import { authRequired } from "../middlewares/validateToken.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { createUserSchema, loginSchema, registerSchema, updateUserSchema } from "../schemas/auth.schema.js";
const router = Router()


router.post('/register', validateSchema(registerSchema), register)
router.post('/login', validateSchema(loginSchema), login)
router.post('/logout', logout)
router.get('/profile', authRequired, profile)
router.get('/users/all', authRequired, listAllUsers)
router.post('/users', authRequired, validateSchema(createUserSchema), createUser)
router.put('/users/:id', authRequired, validateSchema(updateUserSchema), updateUser)
router.delete('/users/:id', authRequired, deleteUser)
router.get('/users', authRequired, listUsers)
router.get('/verify', verifyToken)



export default router
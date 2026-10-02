import { Router } from "express";
import { createUser, deleteUser, listAllUsers, listUsers, login, logout, profile, updateUser, verifyToken } from "../controllers/auth.controller.js";
import { authRequired } from "../middlewares/validateToken.js";
import { permisoRequired } from "../middlewares/permiso.js";
import { loginLimiter } from "../middlewares/loginLimit.js";
import { validateSchema } from "../middlewares/validator.middleware.js";
import { createUserSchema, loginSchema, updateUserSchema } from "../schemas/auth.schema.js";
const router = Router()


router.post('/login', loginLimiter, validateSchema(loginSchema), login)
router.post('/logout', logout)
router.get('/profile', authRequired, profile)
router.get('/users/all', authRequired, permisoRequired('usuarios.ver'), listAllUsers)
router.post('/users', authRequired, permisoRequired('usuarios.crear'), validateSchema(createUserSchema), createUser)
router.put('/users/:id', authRequired, permisoRequired('usuarios.editar'), validateSchema(updateUserSchema), updateUser)
router.delete('/users/:id', authRequired, permisoRequired('usuarios.eliminar'), deleteUser)
router.get('/users', authRequired, permisoRequired('tablero.ver'), listUsers)
router.get('/verify', verifyToken)



export default router
import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { permisoRequired } from '../middlewares/permiso.js'
import { getLogs, getMailLogs, getSessionLogs } from '../controllers/logs.controller.js'

const router = Router()

router.get('/logs/mail', authRequired, permisoRequired('logs.ver'), getMailLogs)
router.get('/logs/session', authRequired, permisoRequired('logs.ver'), getSessionLogs)
router.get('/logs', authRequired, permisoRequired('logs.ver'), getLogs)

export default router

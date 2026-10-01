import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { getLogs, getMailLogs, getSessionLogs } from '../controllers/logs.controller.js'

const router = Router()

router.get('/logs/mail', authRequired, getMailLogs)
router.get('/logs/session', authRequired, getSessionLogs)
router.get('/logs', authRequired, getLogs)

export default router

import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { getLogs } from '../controllers/logs.controller.js'

const router = Router()

router.get('/logs', authRequired, getLogs)

export default router

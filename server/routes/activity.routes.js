import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { listActivities } from '../controllers/activity.controller.js'

const router = Router()

router.get('/activity', authRequired, listActivities)

export default router

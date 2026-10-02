import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { permisoRequired } from '../middlewares/permiso.js'
import { listActivities } from '../controllers/activity.controller.js'

const router = Router()

router.get('/activity', authRequired, permisoRequired('monitoreo.ver'), listActivities)

export default router

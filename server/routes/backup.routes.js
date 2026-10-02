import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { permisoRequired } from '../middlewares/permiso.js'
import { downloadBackup, importBackup } from '../controllers/backup.controller.js'

const router = Router()

router.get('/backup', authRequired, permisoRequired('configuraciones.backup'), downloadBackup)
router.post('/backup', authRequired, permisoRequired('configuraciones.restaurar'), importBackup)

export default router

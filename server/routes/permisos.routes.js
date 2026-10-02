import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { permisoRequired } from '../middlewares/permiso.js'
import { listPermisos, savePermisos } from '../controllers/permisos.controller.js'

const router = Router()

router.get('/permisos', authRequired, permisoRequired('permisos.ver'), listPermisos)
router.put('/permisos', authRequired, permisoRequired('permisos.editar'), savePermisos)

export default router

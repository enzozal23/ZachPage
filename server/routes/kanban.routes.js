import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { permisoRequired } from '../middlewares/permiso.js'
import { cronSecretRequired } from '../middlewares/cronSecret.js'
import {
  getKanban,
  saveKanban,
  importKanbanWord,
  getSettings,
  saveSettings,
  testDueReminder,
  runDueReminders,
} from '../controllers/kanban.controller.js'

const router = Router()

router.get('/kanban', authRequired, permisoRequired('tablero.ver'), getKanban)
router.put('/kanban', authRequired, saveKanban)
router.post('/kanban/imports', authRequired, permisoRequired('importaciones.importar'), importKanbanWord)
router.get('/kanban/settings', authRequired, permisoRequired('configuraciones.ver'), getSettings)
router.put('/kanban/settings', authRequired, permisoRequired('configuraciones.editar'), saveSettings)
router.post('/kanban/tickets/:id/test-reminder', authRequired, permisoRequired('configuraciones.editar'), testDueReminder)
router.post('/kanban/reminders/run', cronSecretRequired, runDueReminders)

export default router

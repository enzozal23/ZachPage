import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { cronSecretRequired } from '../middlewares/cronSecret.js'
import { getKanban, saveKanban, testDueReminder, runDueReminders } from '../controllers/kanban.controller.js'

const router = Router()

router.get('/kanban', authRequired, getKanban)
router.put('/kanban', authRequired, saveKanban)
router.post('/kanban/tickets/:id/test-reminder', authRequired, testDueReminder)
router.post('/kanban/reminders/run', cronSecretRequired, runDueReminders)

export default router

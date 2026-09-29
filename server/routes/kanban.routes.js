import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { getKanban, saveKanban, testDueReminder } from '../controllers/kanban.controller.js'

const router = Router()

router.get('/kanban', authRequired, getKanban)
router.put('/kanban', authRequired, saveKanban)
router.post('/kanban/tickets/:id/test-reminder', authRequired, testDueReminder)

export default router

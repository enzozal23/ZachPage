import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { createClient, deleteClient, importClients, listClients, updateClient } from '../controllers/clients.controller.js'

const router = Router()

router.get('/clients', authRequired, listClients)
router.post('/clients/import', authRequired, importClients)
router.post('/clients', authRequired, createClient)
router.put('/clients/:id', authRequired, updateClient)
router.delete('/clients/:id', authRequired, deleteClient)

export default router

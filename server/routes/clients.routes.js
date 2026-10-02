import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import {
  createClient,
  createClientField,
  deleteClient,
  deleteClientField,
  importClients,
  listClientFields,
  listClients,
  logClientsExport,
  migrateClientFields,
  updateClient,
  updateClientField,
} from '../controllers/clients.controller.js'

const router = Router()

router.get('/clients/fields', authRequired, listClientFields)
router.post('/clients/fields/migrate', authRequired, migrateClientFields)
router.post('/clients/fields', authRequired, createClientField)
router.put('/clients/fields/:id', authRequired, updateClientField)
router.delete('/clients/fields/:id', authRequired, deleteClientField)
router.post('/clients/export', authRequired, logClientsExport)
router.get('/clients', authRequired, listClients)
router.post('/clients/import', authRequired, importClients)
router.post('/clients', authRequired, createClient)
router.put('/clients/:id', authRequired, updateClient)
router.delete('/clients/:id', authRequired, deleteClient)

export default router

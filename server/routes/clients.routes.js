import { Router } from 'express'
import { authRequired } from '../middlewares/validateToken.js'
import { permisoRequired } from '../middlewares/permiso.js'
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

router.get('/clients/fields', authRequired, permisoRequired(['clientes.ver', 'clientes.campos']), listClientFields)
router.post('/clients/fields/migrate', authRequired, permisoRequired('clientes.migrar'), migrateClientFields)
router.post('/clients/fields', authRequired, permisoRequired('clientes.campos'), createClientField)
router.put('/clients/fields/:id', authRequired, permisoRequired('clientes.campos'), updateClientField)
router.delete('/clients/fields/:id', authRequired, permisoRequired('clientes.campos'), deleteClientField)
router.post('/clients/export', authRequired, permisoRequired('clientes.exportar'), logClientsExport)
router.get('/clients', authRequired, permisoRequired(['clientes.ver', 'tablero.ver']), listClients)
router.post('/clients/import', authRequired, permisoRequired('clientes.importar'), importClients)
router.post('/clients', authRequired, permisoRequired('clientes.crear'), createClient)
router.put('/clients/:id', authRequired, permisoRequired('clientes.editar'), updateClient)
router.delete('/clients/:id', authRequired, permisoRequired('clientes.eliminar'), deleteClient)

export default router

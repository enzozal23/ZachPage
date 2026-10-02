import User from '../models/user.models.js'
import { PERMISOS, botonesDe, guardarPermisos, permisosDe } from '../libs/permisos.js'
import { requestIp, writeActivities } from '../libs/activityLog.js'

const ROLES = [
  { id: 'admin', nombre: 'Administrador' },
  { id: 'user', nombre: 'Usuario' },
]

export const listPermisos = async (req, res) => {
  const asignados = {}
  for (const rol of ROLES) asignados[rol.id] = await permisosDe(rol.id)
  res.json({
    permisos: PERMISOS,
    roles: ROLES,
    asignados,
    botones: await botonesDe(req.user?.role, 'permisos'),
  })
}

export const savePermisos = async (req, res) => {
  const rol = String(req.body?.rol || '')
  if (rol !== 'admin' && rol !== 'user') {
    return res.status(400).json({ message: 'El rol no es válido.' })
  }
  const before = await permisosDe(rol)
  const after = await guardarPermisos(rol, req.body?.permisos)
  const user = req.user?.id ? await User.findById(req.user.id).select('username email') : null
  const nombre = rol === 'admin' ? 'administrador' : 'usuario'
  await writeActivities([{
    action: 'update',
    entity: 'permiso',
    ticketId: '',
    ticketTitle: nombre,
    summary: `Actualizó los permisos del rol ${nombre}`,
    userId: String(req.user?.id || ''),
    username: user?.username || '',
    email: user?.email || '',
    ip: requestIp(req),
    detail: { before, after },
  }])
  const asignados = {}
  for (const item of ROLES) asignados[item.id] = await permisosDe(item.id)
  res.json({
    permisos: PERMISOS,
    roles: ROLES,
    asignados,
    botones: await botonesDe(req.user?.role, 'permisos'),
  })
}

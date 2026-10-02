import { tiene_permiso } from '../libs/permisos.js'

export function permisoRequired(permiso) {
  const lista = Array.isArray(permiso) ? permiso : [permiso]
  return async (req, res, next) => {
    if (!req.user?.id) return res.status(401).json({ message: 'No autorizado.' })
    for (const item of lista) {
      if (await tiene_permiso(req.user.role, item)) return next()
    }
    return res.status(403).json({ message: 'No tenés permiso para esto.' })
  }
}

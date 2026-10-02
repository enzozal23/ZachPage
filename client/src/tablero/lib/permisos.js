import { useAuth } from '../../context/AuthContext.jsx'

export function tiene_permiso(rol, permiso, permisos = []) {
  if (!rol || !permiso) return false
  return Array.isArray(permisos) && permisos.includes(permiso)
}

export function usePermiso(permiso) {
  const { user } = useAuth()
  return tiene_permiso(user?.role, permiso, user?.permisos || [])
}

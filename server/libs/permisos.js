import RolePermission from '../models/rolePermission.model.js'

export const PERMISOS = [
  { id: 'tablero.ver', grupo: 'Tablero', nombre: 'Ver el tablero', inicializar: true },
  { id: 'tablero.crear', grupo: 'Tablero', nombre: 'Crear tarjetas', inicializar: true },
  { id: 'tablero.editar', grupo: 'Tablero', nombre: 'Editar tarjetas', inicializar: true },
  { id: 'tablero.eliminar', grupo: 'Tablero', nombre: 'Eliminar tarjetas', inicializar: true },
  { id: 'tablero.importar', grupo: 'Tablero', nombre: 'Importar Word', inicializar: true },
  { id: 'importaciones.ver', grupo: 'Importaciones', nombre: 'Ver importaciones', inicializar: true },
  { id: 'importaciones.eliminar', grupo: 'Importaciones', nombre: 'Eliminar importaciones', inicializar: true },
  { id: 'clientes.ver', grupo: 'Clientes', nombre: 'Ver clientes', inicializar: true },
  { id: 'clientes.crear', grupo: 'Clientes', nombre: 'Crear clientes', inicializar: true },
  { id: 'clientes.editar', grupo: 'Clientes', nombre: 'Editar clientes', inicializar: true },
  { id: 'clientes.eliminar', grupo: 'Clientes', nombre: 'Eliminar clientes', inicializar: true },
  { id: 'clientes.importar', grupo: 'Clientes', nombre: 'Importar Excel', inicializar: true },
  { id: 'clientes.exportar', grupo: 'Clientes', nombre: 'Exportar Excel', inicializar: true },
  { id: 'clientes.campos', grupo: 'Clientes', nombre: 'Campos configurables', inicializar: true },
  { id: 'clientes.migrar', grupo: 'Clientes', nombre: 'Migrar campos', inicializar: true },
  { id: 'monitoreo.ver', grupo: 'Monitoreo', nombre: 'Ver acciones', inicializar: true },
  { id: 'logs.ver', grupo: 'Monitoreo', nombre: 'Ver logs', inicializar: true },
  { id: 'configuraciones.ver', grupo: 'Configuraciones', nombre: 'Ver configuraciones', inicializar: true },
  { id: 'configuraciones.editar', grupo: 'Configuraciones', nombre: 'Editar configuraciones', inicializar: true },
  { id: 'usuarios.ver', grupo: 'Usuarios', nombre: 'Ver usuarios', inicializar: true },
  { id: 'usuarios.crear', grupo: 'Usuarios', nombre: 'Crear usuarios', inicializar: true },
  { id: 'usuarios.editar', grupo: 'Usuarios', nombre: 'Editar usuarios', inicializar: true },
  { id: 'usuarios.eliminar', grupo: 'Usuarios', nombre: 'Eliminar usuarios', inicializar: true },
  { id: 'permisos.ver', grupo: 'Permisos', nombre: 'Ver permisos', inicializar: true },
  { id: 'permisos.editar', grupo: 'Permisos', nombre: 'Editar permisos', inicializar: true },
  { id: 'novedades.ver', grupo: 'Novedades', nombre: 'Ver novedades', inicializar: true },
]

const IDS = new Set(PERMISOS.map((item) => item.id))
const ROLES = ['admin', 'user']

const USUARIO_INICIAL = [
  'tablero.ver',
  'tablero.crear',
  'tablero.editar',
  'clientes.ver',
  'importaciones.ver',
  'novedades.ver',
]

export function permisosIniciales(rol) {
  if (rol === 'admin') return PERMISOS.filter((item) => item.inicializar).map((item) => item.id)
  return USUARIO_INICIAL.filter((id) => IDS.has(id))
}

function aplicarInicializacion(rol, guardados, yaInicializados, esNuevo) {
  const conocidos = new Set(yaInicializados || [])
  const activos = new Set(esNuevo ? permisosIniciales(rol) : (guardados || []))
  if (!esNuevo && conocidos.size === 0) {
    for (const permiso of PERMISOS) conocidos.add(permiso.id)
    return {
      permisos: limpiar(rol, [...activos]),
      inicializados: [...conocidos],
      cambio: true,
    }
  }
  let cambio = esNuevo
  for (const permiso of PERMISOS) {
    if (conocidos.has(permiso.id)) continue
    if (rol === 'admin' && permiso.inicializar) activos.add(permiso.id)
    conocidos.add(permiso.id)
    cambio = true
  }
  return {
    permisos: limpiar(rol, [...activos]),
    inicializados: [...conocidos],
    cambio,
  }
}

function limpiar(rol, lista) {
  const next = [...new Set((lista || []).filter((id) => IDS.has(id)))]
  if (rol === 'admin') {
    if (!next.includes('permisos.ver')) next.push('permisos.ver')
    if (!next.includes('permisos.editar')) next.push('permisos.editar')
  }
  return next
}

export async function permisosDe(rol) {
  const role = ROLES.includes(rol) ? rol : 'user'
  const doc = await RolePermission.findOne({ role })
  const aplicado = aplicarInicializacion(role, doc?.permisos, doc?.inicializados, !doc)
  if (aplicado.cambio) {
    await RolePermission.findOneAndUpdate(
      { role },
      { role, permisos: aplicado.permisos, inicializados: aplicado.inicializados },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )
  }
  return aplicado.permisos
}

export async function tiene_permiso(rol, permiso) {
  if (!IDS.has(permiso)) return false
  const lista = await permisosDe(rol)
  return lista.includes(permiso)
}

export async function guardarPermisos(rol, lista) {
  if (!ROLES.includes(rol)) return null
  const permisos = limpiar(rol, lista)
  const doc = await RolePermission.findOneAndUpdate(
    { role: rol },
    { role: rol, permisos, inicializados: PERMISOS.map((item) => item.id) },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
  return doc.permisos
}

export function permisoValido(permiso) {
  return IDS.has(permiso)
}

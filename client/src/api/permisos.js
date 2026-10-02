import axios from './axios'

export const listPermisosRequest = () => axios.get('api/permisos')
export const savePermisosRequest = (rol, permisos) => axios.put('api/permisos', { rol, permisos })

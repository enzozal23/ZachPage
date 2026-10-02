import { Fragment, useEffect, useState } from 'react'
import { listPermisosRequest, savePermisosRequest } from '../../api/permisos.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { boton } from '../lib/botones.js'
import { Button } from './ui/Button.jsx'

function readError(error, fallback) {
  const message = error.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

function PermissionsPage() {
  const { user, refreshProfile } = useAuth()
  const [botones, setBotones] = useState([])
  const editar = boton(botones, 'editar')
  const [permisos, setPermisos] = useState([])
  const [roles, setRoles] = useState([])
  const [asignados, setAsignados] = useState({})
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listPermisosRequest()
      .then((res) => {
        setPermisos(Array.isArray(res.data?.permisos) ? res.data.permisos : [])
        setRoles(Array.isArray(res.data?.roles) ? res.data.roles : [])
        setAsignados(res.data?.asignados || {})
        setBotones(Array.isArray(res.data?.botones) ? res.data.botones : [])
      })
      .catch((err) => setError(readError(err, 'No se pudieron cargar los permisos.')))
  }, [])

  function toggle(rol, permiso) {
    if (!editar) return
    if (rol === 'admin' && (permiso === 'permisos.ver' || permiso === 'permisos.editar')) return
    setAsignados((current) => {
      const lista = new Set(current[rol] || [])
      if (lista.has(permiso)) lista.delete(permiso)
      else lista.add(permiso)
      return { ...current, [rol]: [...lista] }
    })
    setNotice(null)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      let last = null
      for (const rol of roles) {
        const res = await savePermisosRequest(rol.id, asignados[rol.id] || [])
        last = res.data
      }
      if (last) {
        setPermisos(last.permisos || [])
        setRoles(last.roles || [])
        setAsignados(last.asignados || {})
        setBotones(Array.isArray(last.botones) ? last.botones : [])
      }
      if (user?.role) await refreshProfile()
      setNotice('Permisos guardados.')
    } catch (err) {
      setError(readError(err, 'No se pudieron guardar los permisos.'))
    } finally {
      setSaving(false)
    }
  }

  const grupos = []
  for (const permiso of permisos) {
    const grupo = grupos.find((item) => item.nombre === permiso.grupo)
    if (grupo) grupo.items.push(permiso)
    else grupos.push({ nombre: permiso.grupo, items: [permiso] })
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Permisos</h2>
          <p className="mt-1 text-sm text-muted">Cada acción de Lexora consulta si el rol tiene el permiso.</p>
        </div>
        {editar && <Button onClick={handleSave} disabled={saving || roles.length === 0}>{saving ? 'Guardando…' : editar.nombre}</Button>}
      </div>
      {error && <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-chip-emerald px-3 py-2 text-sm text-chip-emerald-ink" role="status">{notice}</p>}
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-sunken text-xs tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-2 font-medium">Acción</th>
              {roles.map((rol) => (
                <th key={rol.id} className="px-4 py-2 font-medium">{rol.nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <Fragment key={grupo.nombre}>
                <tr className="border-t border-line bg-canvas">
                  <td className="px-4 py-2 text-xs font-semibold tracking-wide text-muted uppercase" colSpan={1 + roles.length}>{grupo.nombre}</td>
                </tr>
                {grupo.items.map((permiso) => (
                  <tr key={permiso.id} className="border-t border-line">
                    <td className="px-4 py-3 text-ink">{permiso.nombre}</td>
                    {roles.map((rol) => {
                      const bloqueado = rol.id === 'admin' && (permiso.id === 'permisos.ver' || permiso.id === 'permisos.editar')
                      const activo = (asignados[rol.id] || []).includes(permiso.id)
                      return (
                        <td key={rol.id} className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={activo}
                            disabled={!editar || bloqueado}
                            aria-label={`${permiso.nombre} para ${rol.nombre}`}
                            onChange={() => toggle(rol.id, permiso.id)}
                          />
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default PermissionsPage

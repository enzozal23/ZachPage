import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivityRequest } from '../../api/activity.js'
import { Button } from './ui/Button.jsx'
import { controlClass } from './ui/styles.js'

const ACTION_BADGE = {
  create: 'bg-chip-emerald text-chip-emerald-ink',
  update: 'bg-chip-amber text-chip-amber-ink',
  delete: 'bg-chip-red text-chip-red-ink',
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-AR')
}

function actionLabel(action) {
  if (action === 'create') return 'Create'
  if (action === 'delete') return 'Delete'
  return 'Update'
}

function ActivityPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [ticketId, setTicketId] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (ticketId.trim()) params.ticketId = ticketId.trim()
      if (action) params.action = action
      if (from) params.from = from
      if (to) params.to = to
      const res = await getActivityRequest(params)
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cargar el monitoreo.')
    } finally {
      setLoading(false)
    }
  }, [ticketId, action, from, to])

  useEffect(() => {
    load()
  }, [load])

  const fieldClass = 'flex flex-col gap-1.5 text-sm font-medium text-muted'

  return (
    <section className="flex flex-1 flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Monitoreo</h2>
          <p className="mt-1 text-sm text-muted">Registro de altas, cambios y bajas del tablero y de la configuración.</p>
        </div>
        <Button variant="secondary" onClick={load}>
          Actualizar
        </Button>
      </div>

      <form
        className="grid items-end gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault()
          load()
        }}
      >
        <label className={fieldClass}>
          <span>ID de tarjeta</span>
          <input
            className={controlClass}
            value={ticketId}
            onChange={(event) => setTicketId(event.target.value)}
            placeholder="uuid de la card"
          />
        </label>
        <label className={fieldClass}>
          <span>Acción</span>
          <select className={controlClass} value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">Todas</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </label>
        <label className={fieldClass}>
          <span>Desde</span>
          <input className={controlClass} type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label className={fieldClass}>
          <span>Hasta</span>
          <input className={controlClass} type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <Button type="submit">Filtrar</Button>
      </form>

      {loading && <p className="text-sm text-muted">Cargando…</p>}
      {error && <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-muted">Todavía no hay movimientos registrados.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-sunken text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Fecha y hora</th>
                <th className="px-3 py-2 font-medium">Acción</th>
                <th className="px-3 py-2 font-medium">Ticket</th>
                <th className="px-3 py-2 font-medium">Usuario</th>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-t border-line">
                  <td className="px-3 py-2">{formatTime(row.createdAt)}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ACTION_BADGE[row.action] || 'bg-sunken text-muted'}`}>
                      {actionLabel(row.action)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {row.ticketId ? (
                      <Link to={`/t/${row.ticketId}`} className="flex flex-col text-chip-indigo-ink">
                        <strong>{row.ticketTitle || 'Sin título'}</strong>
                        <span className="text-xs text-muted">{row.ticketId}</span>
                      </Link>
                    ) : (
                      <span>{row.ticketTitle || row.entity || '—'}</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <strong>{row.username || row.email || 'Sin usuario'}</strong>
                      {row.email && row.username ? <span className="text-xs text-muted">{row.email}</span> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">{row.ip || '—'}</td>
                  <td className="px-3 py-2">{row.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default ActivityPage

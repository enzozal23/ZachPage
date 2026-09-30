import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActivityRequest } from '../../api/activity.js'

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

  return (
    <section className="activity-page">
      <div className="activity-hero">
        <div>
          <h2>Monitoreo</h2>
          <p>Registro de altas, cambios y bajas del tablero.</p>
        </div>
        <button type="button" className="btn-secondary" onClick={load}>
          Actualizar
        </button>
      </div>

      <form
        className="activity-filters"
        onSubmit={(event) => {
          event.preventDefault()
          load()
        }}
      >
        <label>
          <span>ID de tarjeta</span>
          <input
            value={ticketId}
            onChange={(event) => setTicketId(event.target.value)}
            placeholder="uuid de la card"
          />
        </label>
        <label>
          <span>Acción</span>
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">Todas</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </label>
        <label>
          <span>Desde</span>
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        </label>
        <label>
          <span>Hasta</span>
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </label>
        <button type="submit">Filtrar</button>
      </form>

      {loading && <p className="activity-empty">Cargando…</p>}
      {error && <p className="import-error" role="alert">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="activity-empty">Todavía no hay movimientos registrados.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="activity-table-wrap">
          <table className="activity-table">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Acción</th>
                <th>Ticket</th>
                <th>Usuario</th>
                <th>IP</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id}>
                  <td>{formatTime(row.createdAt)}</td>
                  <td>
                    <span className={`activity-action is-${row.action}`}>
                      {actionLabel(row.action)}
                    </span>
                  </td>
                  <td>
                    {row.ticketId ? (
                      <Link to={`/t/${row.ticketId}`} className="activity-ticket">
                        <strong>{row.ticketTitle || 'Sin título'}</strong>
                        <span>{row.ticketId}</span>
                      </Link>
                    ) : (
                      <span>{row.ticketTitle || row.entity || '—'}</span>
                    )}
                  </td>
                  <td>
                    <div className="activity-user">
                      <strong>{row.username || row.email || 'Sin usuario'}</strong>
                      {row.email && row.username ? <span>{row.email}</span> : null}
                    </div>
                  </td>
                  <td>{row.ip || '—'}</td>
                  <td>{row.summary}</td>
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

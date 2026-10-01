import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getActivityRequest } from '../../api/activity.js'
import { getLogsRequest, getMailLogsRequest, getSessionLogsRequest } from '../../api/logs.js'
import { Button } from './ui/Button.jsx'
import { controlClass } from './ui/styles.js'

const ACTION_BADGE = {
  create: 'bg-chip-emerald text-chip-emerald-ink',
  update: 'bg-chip-amber text-chip-amber-ink',
  delete: 'bg-chip-red text-chip-red-ink',
}

const VIEWS = [
  { id: 'acciones', title: 'Logs de acciones', text: 'Altas, cambios y bajas del tablero y de la configuración.' },
  { id: 'mails', title: 'Logs de mails', text: 'Todos los correos que salen de la aplicación.' },
  { id: 'sesion', title: 'Logs de sesión', text: 'Ingresos, salidas e intentos fallidos de contraseña.' },
  { id: 'sistema', title: 'Logs de sistema', text: 'Mensajes de info y error del servidor.' },
]

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-AR')
}

function actionLabel(action) {
  if (action === 'create') return 'Agregó'
  if (action === 'delete') return 'Eliminó'
  return 'Actualizó'
}

const STATUS_LABEL = {
  pending_estimate: 'Pendiente estimación/asignación',
  todo: 'Por hacer',
  in_progress: 'En progreso',
  review: 'En revisión',
  done: 'Hecho',
}

function quote(value) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim()
  if (!text) return 'vacío'
  return `«${text.length > 90 ? `${text.slice(0, 90)}…` : text}»`
}

function nameList(list) {
  const source = Array.isArray(list) ? list : String(list || '').split(',')
  return [...new Set(source.map((item) => String(item || '').trim()).filter(Boolean))]
}

function membershipLines(noun, before, after) {
  const prev = new Set(nameList(before))
  const next = new Set(nameList(after))
  const lines = []
  for (const item of next) {
    if (!prev.has(item)) lines.push(`Agregó ${noun} ${quote(item)}`)
  }
  for (const item of prev) {
    if (!next.has(item)) lines.push(`Eliminó ${noun} ${quote(item)}`)
  }
  return lines
}

function taskLines(before, after) {
  const keyOf = (task, index) => String(task?.id || task?.text || index)
  const prev = new Map((before || []).map((task, index) => [keyOf(task, index), task]))
  const next = new Map((after || []).map((task, index) => [keyOf(task, index), task]))
  const lines = []
  for (const [id, task] of next) {
    const old = prev.get(id)
    if (!old) {
      lines.push(`Agregó la tarea ${quote(task.text)}`)
      continue
    }
    if (String(old.text || '') !== String(task.text || '')) {
      lines.push(`Actualizó la tarea: ${quote(old.text)} → ${quote(task.text)}`)
    }
    if (Boolean(old.done) !== Boolean(task.done)) {
      lines.push(`${task.done ? 'Marcó como hecha' : 'Marcó como pendiente'} la tarea ${quote(task.text)}`)
    }
  }
  for (const [id, task] of prev) {
    if (!next.has(id)) lines.push(`Eliminó la tarea ${quote(task.text)}`)
  }
  return lines
}

function describeStoredChange(detail) {
  if (!detail || typeof detail !== 'object' || !detail.before || !detail.after) return []
  const before = detail.before
  const after = detail.after
  const lines = []
  if ((before.title || '') !== (after.title || '')) {
    lines.push(`Actualizó el título: ${quote(before.title)} → ${quote(after.title)}`)
  }
  if ((before.description || '') !== (after.description || '')) {
    lines.push(`Actualizó la descripción: ${quote(after.description)}`)
  }
  if ((before.status || '') !== (after.status || '')) {
    const label = (status) => STATUS_LABEL[status] || status || 'vacío'
    lines.push(`Actualizó el estado: ${label(before.status)} → ${label(after.status)}`)
  }
  if ((before.priority || '') !== (after.priority || '')) {
    lines.push(`Actualizó la prioridad: ${quote(before.priority)} → ${quote(after.priority)}`)
  }
  if ((before.dueDate || '') !== (after.dueDate || '')) {
    lines.push(`Actualizó la fecha límite: ${quote(before.dueDate)} → ${quote(after.dueDate)}`)
  }
  if ((before.expediente || '') !== (after.expediente || '')) {
    lines.push(`Actualizó el N° de expediente: ${quote(before.expediente)} → ${quote(after.expediente)}`)
  }
  lines.push(...membershipLines('el responsable', before.assignees, after.assignees))
  lines.push(...membershipLines('el seguidor', before.followers, after.followers))
  lines.push(...membershipLines('la etiqueta', before.labels, after.labels))
  lines.push(...taskLines(before.tasks, after.tasks))
  const commentsDelta = Number(after.commentsCount || 0) - Number(before.commentsCount || 0)
  if (commentsDelta > 0) lines.push(`Agregó ${commentsDelta} ${commentsDelta === 1 ? 'nota' : 'notas'} al historial`)
  if (commentsDelta < 0) {
    const count = -commentsDelta
    lines.push(`Eliminó ${count} ${count === 1 ? 'nota' : 'notas'} del historial`)
  }
  return lines
}

function activityLines(row) {
  const summary = String(row.summary || '')
  if (/^(Agregó|Eliminó|Actualizó|Marcó|Movió) /.test(summary)) return [summary]
  const stored = describeStoredChange(row.detail)
  if (stored.length) return stored
  if (summary.startsWith('Alta de tarjeta: ')) return [`Agregó la tarjeta ${quote(summary.slice('Alta de tarjeta: '.length))}`]
  if (summary.startsWith('Eliminación de tarjeta: ')) return [`Eliminó la tarjeta ${quote(summary.slice('Eliminación de tarjeta: '.length))}`]
  return [summary || '—']
}

function viewFromLocation(pathname) {
  if (pathname === '/logs') return 'sistema'
  const segment = pathname.split('/').filter(Boolean).pop()
  return VIEWS.some((item) => item.id === segment) ? segment : 'acciones'
}

function LogFrame({ title, description, onRefresh, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <Button variant="secondary" onClick={onRefresh}>Actualizar</Button>
      </div>
      {children}
    </div>
  )
}

function StatusLine({ loading, error, empty }) {
  if (loading) return <p className="text-sm text-muted">Cargando…</p>
  if (error) return <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>
  if (empty) return <p className="text-sm text-muted">Todavía no hay registros.</p>
  return null
}

function ActionsLog() {
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
    <LogFrame title="Logs de acciones" description="Registro de altas, cambios y bajas del tablero y de la configuración." onRefresh={load}>
      <form
        className="grid items-end gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-5"
        onSubmit={(event) => {
          event.preventDefault()
          load()
        }}
      >
        <label className={fieldClass}>
          <span>ID de tarjeta</span>
          <input className={controlClass} value={ticketId} onChange={(event) => setTicketId(event.target.value)} placeholder="uuid de la card" />
        </label>
        <label className={fieldClass}>
          <span>Acción</span>
          <select className={controlClass} value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">Todas</option>
            <option value="create">Agregó</option>
            <option value="update">Actualizó</option>
            <option value="delete">Eliminó</option>
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
      <StatusLine loading={loading} error={error} empty={!loading && !error && rows.length === 0} />
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
                  <td className="px-3 py-2 whitespace-normal break-words">
                    {activityLines(row).map((line, index) => (
                      <div key={`${row._id}-${index}`}>{line}</div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LogFrame>
  )
}

function useLogList(loader) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await loader()
      setRows(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los logs.')
    } finally {
      setLoading(false)
    }
  }, [loader])

  useEffect(() => {
    load()
  }, [load])

  return { rows, loading, error, load }
}

function MailLog() {
  const loader = useCallback(() => getMailLogsRequest(), [])
  const { rows, loading, error, load } = useLogList(loader)

  return (
    <LogFrame title="Logs de mails" description="Cada correo que la aplicación intenta enviar queda acá, enviado o fallido." onRefresh={load}>
      <StatusLine loading={loading} error={error} empty={!loading && !error && rows.length === 0} />
      {!loading && rows.length > 0 && (
        <div className="flex flex-col gap-3">
          {rows.map((row) => (
            <article key={row._id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.status === 'sent' ? 'bg-chip-emerald text-chip-emerald-ink' : 'bg-chip-red text-chip-red-ink'}`}>
                  {row.status === 'sent' ? 'Enviado' : 'Falló'}
                </span>
                <span className="text-xs text-muted">{formatTime(row.createdAt)}</span>
                <span className="text-xs text-muted">{row.provider || '—'}</span>
                {row.kind ? <span className="text-xs text-muted">{row.kind}</span> : null}
              </div>
              <h4 className="mt-2 font-semibold text-ink">{row.subject || 'Sin asunto'}</h4>
              <p className="mt-1 text-sm text-muted">Para: {(row.to || []).join(', ') || '—'}</p>
              <p className="text-sm text-muted">De: {row.from || '—'}</p>
              {row.error ? <p className="mt-2 text-sm text-chip-red-ink">{row.error}</p> : null}
              {row.text ? (
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-sunken p-3 text-xs text-ink">{row.text}</pre>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </LogFrame>
  )
}

const SESSION_BADGE = {
  login: 'bg-chip-emerald text-chip-emerald-ink',
  logout: 'bg-sunken text-muted',
  failed: 'bg-chip-red text-chip-red-ink',
}

const SESSION_LABEL = {
  login: 'Login',
  logout: 'Logout',
  failed: 'Intento fallido',
}

function SessionLog() {
  const loader = useCallback(() => getSessionLogsRequest(), [])
  const { rows, loading, error, load } = useLogList(loader)

  return (
    <LogFrame title="Logs de sesión" description="Ingresos, cierres de sesión y contraseñas que no coincidieron." onRefresh={load}>
      <StatusLine loading={loading} error={error} empty={!loading && !error && rows.length === 0} />
      {!loading && rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-sunken text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Fecha y hora</th>
                <th className="px-3 py-2 font-medium">Evento</th>
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
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${SESSION_BADGE[row.event] || 'bg-sunken text-muted'}`}>
                      {SESSION_LABEL[row.event] || row.event}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col">
                      <strong>{row.username || row.email || 'Sin usuario'}</strong>
                      {row.email && row.username ? <span className="text-xs text-muted">{row.email}</span> : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">{row.ip || '—'}</td>
                  <td className="px-3 py-2">{row.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LogFrame>
  )
}

function SystemLog() {
  const [level, setLevel] = useState('')
  const loader = useCallback(() => getLogsRequest(level), [level])
  const { rows, loading, error, load } = useLogList(loader)

  return (
    <LogFrame title="Logs de sistema" description="Los registros de info y error que antes estaban en Logs." onRefresh={load}>
      <label className="flex w-48 flex-col gap-1.5 text-sm font-medium text-muted">
        <span>Nivel</span>
        <select className={controlClass} value={level} onChange={(event) => setLevel(event.target.value)}>
          <option value="">Todos</option>
          <option value="info">Info</option>
          <option value="error">Errores</option>
        </select>
      </label>
      <StatusLine loading={loading} error={error} empty={!loading && !error && rows.length === 0} />
      {!loading && rows.length > 0 && (
        <div className="flex flex-col gap-3">
          {rows.map((entry) => (
            <article key={entry._id} className="rounded-2xl border border-line bg-surface p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${entry.level === 'error' ? 'bg-chip-red text-chip-red-ink' : 'bg-chip-amber text-chip-amber-ink'}`}>
                  {entry.level}
                </span>
                <span className="text-xs text-muted">{formatTime(entry.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm text-ink">{entry.message}</p>
              {entry.detail ? (
                <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-sunken p-3 text-xs text-ink">
                  {JSON.stringify(entry.detail, null, 2)}
                </pre>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </LogFrame>
  )
}

const PANELS = {
  acciones: ActionsLog,
  mails: MailLog,
  sesion: SessionLog,
  sistema: SystemLog,
}

function ActivityPage() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const vista = viewFromLocation(pathname)
  const Panel = PANELS[vista] || ActionsLog

  function openView(id) {
    navigate(id === 'acciones' ? '/monitoreo' : `/monitoreo/${id}`)
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-6 py-5">
      <div>
        <h2 className="text-xl font-semibold text-ink">Monitoreo</h2>
        <p className="mt-1 text-sm text-muted">Elegí qué registro querés ver.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Vistas de logs">
        {VIEWS.map((item) => {
          const selected = item.id === vista
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => openView(item.id)}
              className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-indigo-500 bg-surface' : 'border-line bg-surface hover:bg-sunken'}`}
            >
              <span className="block text-sm font-semibold text-ink">{item.title}</span>
              <span className="mt-1 block text-sm text-muted">{item.text}</span>
            </button>
          )
        })}
      </div>

      <Panel />
    </section>
  )
}

export default ActivityPage

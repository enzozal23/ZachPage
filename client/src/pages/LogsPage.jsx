import { useCallback, useEffect, useState } from 'react'
import { getLogsRequest } from '../api/logs.js'

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-AR')
}

function LogsPage() {
  const [logs, setLogs] = useState([])
  const [level, setLevel] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (nextLevel = level) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getLogsRequest(nextLevel)
      setLogs(res.data || [])
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron cargar los logs.')
    } finally {
      setLoading(false)
    }
  }, [level])

  useEffect(() => {
    load(level)
  }, [level, load])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-semibold">Logs</h1>
        <div className="flex gap-2">
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="bg-[#2e1c48] border border-[#4e3876] rounded px-3 py-2"
          >
            <option value="">Todos</option>
            <option value="info">Info</option>
            <option value="error">Errores</option>
          </select>
          <button
            type="button"
            onClick={() => load(level)}
            className="bg-[#6c4ce6] px-4 py-2 rounded"
          >
            Actualizar
          </button>
        </div>
      </div>

      {loading && <p>Cargando…</p>}
      {error && <p className="bg-red-500 text-white rounded p-3">{error}</p>}
      {!loading && logs.length === 0 && <p>Todavía no hay registros.</p>}

      <div className="flex flex-col gap-3">
        {logs.map((entry) => (
          <article key={entry._id} className="bg-[#221538] rounded-md p-4">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={entry.level === 'error' ? 'text-red-400 font-semibold' : 'text-[#c4b6ff] font-semibold'}>
                {entry.level}
              </span>
              <span className="text-[#d8d0f2] text-sm">{formatTime(entry.createdAt)}</span>
            </div>
            <p className="mb-2">{entry.message}</p>
            {entry.detail && (
              <pre className="text-xs text-[#d8d0f2] whitespace-pre-wrap break-words bg-[#160f24] rounded p-3">
                {JSON.stringify(entry.detail, null, 2)}
              </pre>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export default LogsPage

import { useEffect, useState } from 'react'
import { searchUsers } from '../../api/auth.js'
import { ticketAssignees } from '../lib/assignees.js'

function AssigneeSelect({ value, onChange, emptyLabel = 'Buscar usuario' }) {
  const selected = ticketAssignees({ assignees: Array.isArray(value) ? value : undefined, assignee: value })
  const [query, setQuery] = useState('')
  const [matches, setMatches] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setMatches([])
      setBusy(false)
      return
    }
    let cancelled = false
    setBusy(true)
    const handle = setTimeout(() => {
      searchUsers(q)
        .then((list) => {
          if (!cancelled) setMatches(list)
        })
        .catch(() => {
          if (!cancelled) setMatches([])
        })
        .finally(() => {
          if (!cancelled) setBusy(false)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [query])

  function add(label) {
    if (!selected.includes(label)) onChange([...selected, label])
    setQuery('')
    setMatches([])
  }

  function remove(label) {
    onChange(selected.filter((name) => name !== label))
  }

  const visible = matches.filter((user) => !selected.includes(user.username || user.email))

  return (
    <div className="relative">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5">
        {selected.map((name) => (
          <button
            type="button"
            key={name}
            className="inline-flex items-center gap-1 rounded-full bg-chip-indigo px-2 py-0.5 text-xs text-chip-indigo-ink"
            onClick={() => remove(name)}
          >
            {name}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          className="min-w-24 flex-1 border-0 bg-transparent px-1 py-1 text-sm text-ink outline-none"
          type="search"
          value={query}
          placeholder={selected.length ? 'Agregar' : emptyLabel}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {query.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-line bg-surface py-1 text-sm shadow-lg">
          {busy && <li className="px-3 py-2 text-muted">Buscando…</li>}
          {!busy && visible.length === 0 && <li className="px-3 py-2 text-muted">Nadie coincide</li>}
          {visible.map((user) => {
            const label = user.username || user.email
            return (
              <li key={user.id || label}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-ink hover:bg-sunken"
                  onClick={() => add(label)}
                >
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default AssigneeSelect

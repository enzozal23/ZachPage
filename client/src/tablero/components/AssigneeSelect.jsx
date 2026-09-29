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
    <div className="assignee-picker">
      <div className="assignee-chips">
        {selected.map((name) => (
          <button type="button" key={name} className="assignee-chip" onClick={() => remove(name)}>
            {name}
            <span aria-hidden="true">×</span>
          </button>
        ))}
        <input
          type="search"
          value={query}
          placeholder={selected.length ? 'Agregar' : emptyLabel}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {query.trim().length >= 2 && (
        <ul className="assignee-results">
          {busy && <li>Buscando…</li>}
          {!busy && visible.length === 0 && <li>Nadie coincide</li>}
          {visible.map((user) => {
            const label = user.username || user.email
            return (
              <li key={user.id || label}>
                <button type="button" onClick={() => add(label)}>{label}</button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export default AssigneeSelect

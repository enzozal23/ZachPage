import { useState } from 'react'
import { Button } from './ui/Button.jsx'
import { controlClass } from './ui/styles.js'

function BoardSelector({ boards, selectedBoardId, onSelect, onCreate }) {
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')

  function handleCreate(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(trimmed)
    setName('')
    setCreating(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className={`${controlClass} w-auto`}
        value={selectedBoardId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
        aria-label="Tablero seleccionado"
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>
            {board.name}
          </option>
        ))}
      </select>

      {creating ? (
        <form className="flex flex-wrap gap-2" onSubmit={handleCreate}>
          <input
            className={`${controlClass} w-48`}
            autoFocus
            type="text"
            placeholder="Nombre del tablero"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="submit">Crear</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setCreating(false)
              setName('')
            }}
          >
            Cancelar
          </Button>
        </form>
      ) : (
        <Button variant="secondary" onClick={() => setCreating(true)}>
          + Nuevo tablero
        </Button>
      )}
    </div>
  )
}

export default BoardSelector

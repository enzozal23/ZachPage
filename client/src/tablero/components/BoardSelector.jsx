import { useState } from 'react'

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
    <div className="board-selector">
      <select
        className="board-selector-select"
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
        <form className="board-selector-form" onSubmit={handleCreate}>
          <input
            autoFocus
            type="text"
            placeholder="Nombre del tablero"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button type="submit">Crear</button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setCreating(false)
              setName('')
            }}
          >
            Cancelar
          </button>
        </form>
      ) : (
        <button type="button" className="btn-secondary" onClick={() => setCreating(true)}>
          + Nuevo tablero
        </button>
      )}
    </div>
  )
}

export default BoardSelector

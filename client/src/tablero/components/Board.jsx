import { useEffect, useMemo, useState } from 'react'
import { COLUMNS, ticketColumnId } from '../constants/columns.js'
import Column from './Column.jsx'
import BoardFilters from './BoardFilters.jsx'
import { Button } from './ui/Button.jsx'
import { confirmDialog } from '../lib/dialog.js'
import { boton } from '../lib/botones.js'
import {
  EMPTY_FILTERS,
  applyBoardFilters,
  collectFilterOptions,
  loadSavedFilters,
  normalizeFilters,
  saveFiltersToStorage,
} from '../lib/boardFilters.js'

function Board({
  board,
  tickets,
  onAddTicket,
  onEditTicket,
  onDeleteTicket,
  onMoveTicket,
  onResetAll,
  onSaveBoardFilters,
  botones = [],
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [saveNotice, setSaveNotice] = useState('')

  useEffect(() => {
    if (!board?.id) return
    const fromBoard = board.filters ? normalizeFilters(board.filters) : null
    const fromStorage = loadSavedFilters(board.id)
    setFilters(fromBoard || fromStorage || EMPTY_FILTERS)
    setSaveNotice('')
  }, [board?.id])

  const options = useMemo(() => collectFilterOptions(tickets), [tickets])
  const filteredTickets = useMemo(
    () => applyBoardFilters(tickets, filters),
    [tickets, filters],
  )

  function handleSave() {
    saveFiltersToStorage(board.id, filters)
    onSaveBoardFilters?.(board.id, filters)
    setSaveNotice('Configuración guardada')
    window.setTimeout(() => setSaveNotice(''), 2500)
  }

  function handleClear() {
    setFilters(EMPTY_FILTERS)
  }

  const reset = boton(botones, 'reset')
  const guardarFiltros = boton(botones, 'guardar-filtros')
  const mail = boton(botones, 'mail')

  if (!board) return null

  return (
    <div className="flex flex-1 flex-col gap-4 px-6 py-4 pb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink">{board.name}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {reset && onResetAll && <Button
            variant="danger"
            onClick={async () => {
              const confirmed = await confirmDialog({
                title: '¿Eliminar todo?',
                text: 'Esto borra todos los tableros y tickets.',
                confirmText: 'Eliminar',
              })
              if (confirmed) onResetAll()
            }}
          >
            {reset.nombre}
          </Button>}
        </div>
      </div>

      <BoardFilters
        open={filtersOpen}
        onToggle={() => setFiltersOpen((current) => !current)}
        filters={filters}
        onChange={setFilters}
        options={options}
        onClear={handleClear}
        onSave={guardarFiltros && onSaveBoardFilters ? handleSave : undefined}
        saveLabel={guardarFiltros?.nombre}
        saveNotice={saveNotice}
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-5">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tickets={filteredTickets.filter((ticket) => ticketColumnId(ticket) === column.id)}
            onAddTicket={onAddTicket}
            onEditTicket={onEditTicket}
            onDeleteTicket={onDeleteTicket}
            onMoveTicket={onMoveTicket}
            botones={botones}
            mail={mail}
          />
        ))}
      </div>
    </div>
  )
}

export default Board

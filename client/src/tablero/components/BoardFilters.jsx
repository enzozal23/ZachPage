import { countActiveFilters, filterChips, clearFilterKey } from '../lib/boardFilters.js'
import { Button } from './ui/Button.jsx'
import { controlClass } from './ui/styles.js'

function BoardFilters({
  open,
  onToggle,
  filters,
  onChange,
  options,
  onClear,
  onSave,
  saveNotice,
}) {
  const activeCount = countActiveFilters(filters)
  const chips = filterChips(filters)

  function setField(field, value) {
    onChange({ ...filters, [field]: value })
  }

  function selectClass(active) {
    return `${controlClass} ${active ? 'border-indigo-400 ring-2 ring-indigo-500/20' : ''}`
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={onToggle} aria-expanded={open}>
          Filtros
          {activeCount > 0 && (
            <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">{activeCount}</span>
          )}
        </Button>
        {activeCount > 0 && (
          <Button variant="ghost" onClick={onClear}>
            Limpiar
          </Button>
        )}
        <Button onClick={onSave}>Guardar configuración</Button>
        {saveNotice && <span className="text-sm text-chip-emerald-ink">{saveNotice}</span>}
      </div>

      {open && (
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-ink">Filtros</h3>
            <Button variant="ghost" size="sm" onClick={onClear}>
              Limpiar todo
            </Button>
          </div>

          <label className="flex items-center gap-2">
            <input
              className={controlClass}
              type="search"
              value={filters.query}
              onChange={(event) => setField('query', event.target.value)}
              placeholder="Buscar por título o expediente…"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              <span>Columna</span>
              <select className={selectClass(Boolean(filters.column))} value={filters.column} onChange={(event) => setField('column', event.target.value)}>
                <option value="">Todas</option>
                {options.columns.map((column) => (
                  <option key={column.id} value={column.id}>{column.label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              <span>Prioridad</span>
              <select
                className={selectClass(Boolean(filters.priority))}
                value={filters.priority}
                onChange={(event) => setField('priority', event.target.value)}
              >
                <option value="">Todas</option>
                {options.priorities.map((priority) => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              <span>Vencimiento</span>
              <select
                value={filters.duePreset}
                onChange={(event) => setField('duePreset', event.target.value)}
                className={selectClass(Boolean(filters.duePreset))}
              >
                <option value="">Cualquiera</option>
                <option value="overdue">Vencidas</option>
                <option value="today">Vence hoy</option>
                <option value="week">Esta semana</option>
                <option value="none">Sin fecha</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              <span>Rango de fechas</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className={controlClass}
                  type="date"
                  value={filters.dueFrom}
                  onChange={(event) => setField('dueFrom', event.target.value)}
                  aria-label="Desde"
                />
                <input
                  className={controlClass}
                  type="date"
                  value={filters.dueTo}
                  onChange={(event) => setField('dueTo', event.target.value)}
                  aria-label="Hasta"
                />
              </div>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              <span>Etiquetas</span>
              <select
                value={filters.label}
                onChange={(event) => setField('label', event.target.value)}
                className={selectClass(Boolean(filters.label))}
              >
                <option value="">Todas</option>
                {options.labels.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              <span>Asignados</span>
              <select
                value={filters.assignee}
                onChange={(event) => setField('assignee', event.target.value)}
                className={selectClass(Boolean(filters.assignee))}
              >
                <option value="">Todos</option>
                {options.assignees.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-muted sm:col-span-2 xl:col-span-3">
              <span>Seguidores</span>
              <select
                value={filters.follower}
                onChange={(event) => setField('follower', event.target.value)}
                className={selectClass(Boolean(filters.follower))}
              >
                <option value="">Todos</option>
                {options.followers.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </label>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full bg-chip-indigo px-3 py-1 text-sm text-chip-indigo-ink"
                  onClick={() => onChange(clearFilterKey(filters, chip.key))}
                >
                  {chip.label}
                  <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
          )}

          {chips.length === 0 && activeCount === 0 && (
            <p className="text-sm text-muted">Sin filtros activos.</p>
          )}
        </div>
      )}
    </div>
  )
}

export default BoardFilters

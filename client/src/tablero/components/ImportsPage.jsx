import { useRef, useState } from 'react'
import { ticketsFromImport } from '../lib/importTickets.js'
import { parseWordDocx } from '../lib/wordImport.js'
import { Button } from './ui/Button.jsx'
import { boton } from '../lib/botones.js'
import { confirmDialog } from '../lib/dialog.js'
import { panelClass } from './ui/styles.js'

function formatWhen(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-AR')
}

function ImportsPage({
  board,
  imports,
  tickets,
  author,
  onImported,
  onDeleteImport,
  botones = [],
}) {
  const importar = boton(botones, 'importar')
  const eliminar = boton(botones, 'eliminar')
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      const { tickets, skippedNoTitle, warnings } = await parseWordDocx(file)
      warnings.forEach((warning) => console.warn('[Importar Word]', warning))
      await onImported(tickets, {
        fileName: file.name,
        imported: tickets.length,
        skippedNoTitle,
        author,
      })
      setNotice(
        tickets.length > 0
          ? `Se importaron ${tickets.length} tickets a ${board?.name || 'el tablero'}.`
          : 'No se importó ningún ticket.',
      )
    } catch (err) {
      setError(err.message || 'No se pudo importar el archivo.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(item) {
    const count = ticketsFromImport(tickets, item).length
    const noun = count === 1 ? 'ticket' : 'tickets'
    const confirmed = await confirmDialog({
      title: '¿Eliminar la importación?',
      text: `"${item.fileName || 'sin nombre'}". También se van a borrar ${count} ${noun} que salieron de ese archivo.`,
      confirmText: 'Eliminar',
    })
    if (!confirmed) return
    onDeleteImport(item.id)
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">Importaciones</h2>
          <p className="mt-1 text-sm text-muted">
            Los tickets del Word entran al tablero <strong>{board?.name || 'seleccionado'}</strong>.
          </p>
        </div>
        <div>
          {importar && <Button disabled={busy || !board} onClick={() => inputRef.current?.click()}>
            {busy ? 'Importando…' : importar.nombre}
          </Button>}
          <input ref={inputRef} type="file" accept=".docx" hidden onChange={handleFileChange} />
        </div>
      </div>

      {error && <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-chip-amber px-3 py-2 text-sm text-chip-amber-ink" role="status">{notice}</p>}

      <div className="flex flex-col gap-3">
        {imports.length === 0 && <p className="text-sm text-muted">Todavía no hay importaciones.</p>}
        {imports.map((item) => (
          <article key={item.id} className={`${panelClass} flex flex-wrap items-center justify-between gap-3 p-4`}>
            <div>
              <h3 className="font-semibold text-ink">{item.fileName}</h3>
              <p className="text-sm text-muted">{item.boardName || 'Sin tablero'} · {item.author || 'Sin autor'}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>{item.imported} tickets</span>
              <span>{item.skippedNoTitle || 0} sin título</span>
              <time>{formatWhen(item.createdAt)}</time>
              {eliminar && <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
                {eliminar.nombre}
              </Button>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ImportsPage

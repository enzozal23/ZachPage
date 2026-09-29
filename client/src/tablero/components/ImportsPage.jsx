import { useRef, useState } from 'react'
import { parseWordDocx } from '../lib/wordImport.js'

function formatWhen(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-AR')
}

function ImportsPage({
  board,
  imports,
  author,
  onImported,
}) {
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

  return (
    <section className="imports-page">
      <div className="imports-hero">
        <div>
          <h2>Importaciones</h2>
          <p>
            Los tickets del Word entran al tablero <strong>{board?.name || 'seleccionado'}</strong>.
          </p>
        </div>
        <div className="import-word">
          <button type="button" disabled={busy || !board} onClick={() => inputRef.current?.click()}>
            {busy ? 'Importando…' : 'Importar Word'}
          </button>
          <input ref={inputRef} type="file" accept=".docx" hidden onChange={handleFileChange} />
        </div>
      </div>

      {error && <p className="import-error" role="alert">{error}</p>}
      {notice && <p className="import-notice" role="status">{notice}</p>}

      <div className="imports-list">
        {imports.length === 0 && <p className="imports-empty">Todavía no hay importaciones.</p>}
        {imports.map((item) => (
          <article key={item.id} className="import-record">
            <div>
              <h3>{item.fileName}</h3>
              <p>{item.boardName || 'Sin tablero'} · {item.author || 'Sin autor'}</p>
            </div>
            <div className="import-record-stats">
              <span>{item.imported} tickets</span>
              <span>{item.skippedNoTitle || 0} sin título</span>
              <time>{formatWhen(item.createdAt)}</time>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default ImportsPage

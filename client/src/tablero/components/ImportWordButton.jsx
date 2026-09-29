import { useRef, useState } from 'react'
import { parseWordDocx } from '../lib/wordImport.js'

function ImportWordButton({ onImported }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError(null)
    setBusy(true)
    try {
      const { tickets, skippedNoTitle, warnings } = await parseWordDocx(file)
      warnings.forEach((warning) => console.warn('[Importar Word]', warning))

      onImported(tickets, {
        imported: tickets.length,
        skippedNoTitle,
      })
    } catch (err) {
      setError(err.message || 'No se pudo importar el archivo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="import-word">
      <button type="button" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Importando…' : 'Importar Word'}
      </button>
      <input ref={inputRef} type="file" accept=".docx" hidden onChange={handleFileChange} />
      {error && (
        <p className="import-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default ImportWordButton

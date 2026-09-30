import { useRef, useState } from 'react'
import { parseWordDocx } from '../lib/wordImport.js'
import { Button } from './ui/Button.jsx'

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
    <div className="flex flex-col items-end gap-2">
      <Button disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? 'Importando…' : 'Importar Word'}
      </Button>
      <input ref={inputRef} type="file" accept=".docx" hidden onChange={handleFileChange} />
      {error && (
        <p className="max-w-xs rounded-lg bg-chip-red px-3 py-2 text-right text-sm text-chip-red-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default ImportWordButton

import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import {
  createClientRequest,
  deleteClientRequest,
  importClientsRequest,
  listClientFieldsRequest,
  listClientsRequest,
  logClientsExportRequest,
  updateClientRequest,
} from '../../api/clients.js'
import ClientFieldsModal from './ClientFieldsModal.jsx'
import { confirmDialog } from '../lib/dialog.js'
import { clientName, downloadClientsExcel, downloadClientTemplate, parseClientWorkbook } from '../lib/clientExcel.js'
import { Button } from './ui/Button.jsx'
import { Field } from './ui/Field.jsx'
import { controlClass } from './ui/styles.js'

const EMPTY_FORM = {
  tipo: 'fisica',
  nombre: '',
  apellido: '',
  documento: '',
  razonSocial: '',
  email: '',
  telefono: '',
  criticidad: 'media',
  poder: false,
  patrocinio: false,
  extras: {},
}

const CRITICIDAD_CLASS = {
  alta: 'bg-chip-red text-chip-red-ink',
  media: 'bg-chip-amber text-chip-amber-ink',
  baja: 'bg-chip-emerald text-chip-emerald-ink',
}

const CRITICIDAD_LABEL = { alta: 'Alta', media: 'Media', baja: 'Baja' }

function clientFormInitial(client, fields) {
  const extras = { ...(client?.extras || {}) }
  for (const field of fields || []) {
    if (!field.clave) continue
    if (!Object.prototype.hasOwnProperty.call(extras, field.id) || extras[field.id] === undefined || extras[field.id] === null) {
      extras[field.id] = field.tipo === 'checkbox' ? Boolean(client?.[field.clave]) : (client?.[field.clave] ?? '')
    }
  }
  return { ...EMPTY_FORM, ...client, extras }
}

function representacionLabel(client) {
  const parts = []
  if (client?.poder) parts.push('Poder')
  if (client?.patrocinio) parts.push('Patrocinio')
  return parts.join(', ') || '—'
}

function readError(error, fallback) {
  const data = error.response?.data
  if (Array.isArray(data)) return data.filter(Boolean).join(' ')
  if (typeof data?.message === 'string' && data.message.trim()) return data.message
  return fallback
}

function CriticidadBadge({ value }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CRITICIDAD_CLASS[value] || 'bg-sunken text-muted'}`}>
      {CRITICIDAD_LABEL[value] || value || '—'}
    </span>
  )
}

function CriticidadSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const options = ['alta', 'media', 'baja']

  return (
    <div className="relative">
      <button
        type="button"
        className={`${controlClass} flex items-center justify-between`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onBlur={() => setOpen(false)}
      >
        <CriticidadBadge value={value} />
        <span className="text-muted" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-line bg-surface p-1 shadow-lg" role="listbox">
          {options.map((option) => (
            <li key={option}>
              <button
                type="button"
                className="flex w-full rounded-md px-2 py-1.5 hover:bg-sunken"
                role="option"
                aria-selected={option === value}
                onMouseDown={(event) => {
                  event.preventDefault()
                  onChange(option)
                  setOpen(false)
                }}
              >
                <CriticidadBadge value={option} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function optionValue(option) {
  return option && typeof option === 'object' ? option.value : option
}

function optionLabel(option) {
  return option && typeof option === 'object' ? (option.label || option.value) : option
}

function CustomFieldInput({ field, value, onChange }) {
  const label = field.requerido ? `${field.nombre} *` : field.nombre
  if (field.tipo === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} />
        {label}
      </label>
    )
  }
  if (field.clave === 'criticidad') {
    return (
      <div className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-muted">
        {label}
        <CriticidadSelect value={value || 'media'} onChange={onChange} />
      </div>
    )
  }
  if (field.tipo === 'selector') {
    return (
      <Field label={label}>
        <select className={controlClass} value={value || ''} required={field.requerido} onChange={(event) => onChange(event.target.value)}>
          <option value="">Elegir</option>
          {(field.opciones || []).map((option) => (
            <option key={optionValue(option)} value={optionValue(option)}>{optionLabel(option)}</option>
          ))}
        </select>
      </Field>
    )
  }
  const type = field.tipo === 'numero' ? 'number' : field.tipo === 'fecha' ? 'date' : 'text'
  return (
    <Field label={label}>
      <input className={controlClass} type={type} value={value ?? ''} required={field.requerido} onChange={(event) => onChange(event.target.value)} />
    </Field>
  )
}

function ClientFormModal({ mode, initial, fields, onClose, onSubmit }) {
  const titleId = useId()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const juridica = form.tipo === 'juridica'
  const migrated = new Set(fields.filter((field) => field.clave).map((field) => field.clave))

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        tipo: form.tipo,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        documento: form.documento.trim(),
        razonSocial: form.razonSocial.trim(),
        email: form.email.trim(),
        telefono: form.telefono.trim(),
        criticidad: form.criticidad,
        poder: Boolean(form.poder),
        patrocinio: Boolean(form.patrocinio),
        extras: form.extras || {},
      })
    } catch (err) {
      setError(readError(err, 'No se pudo guardar el cliente.'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-2xl bg-surface p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 id={titleId} className="text-lg font-semibold text-ink">{mode === 'edit' ? 'Editar cliente' : 'Nuevo cliente'}</h3>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </header>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {!migrated.has('tipo') && <Field label="Tipo">
            <select className={controlClass} value={form.tipo} onChange={(event) => setField('tipo', event.target.value)}>
              <option value="fisica">Persona física</option>
              <option value="juridica">Persona jurídica</option>
            </select>
          </Field>}
          {(!migrated.has('nombre') || !migrated.has('apellido')) && <div className="grid gap-4 sm:grid-cols-2">
            {!migrated.has('nombre') && <Field label={juridica ? 'Nombre de contacto' : 'Nombre'}>
              <input className={controlClass} value={form.nombre} autoFocus={!juridica} required={!juridica} onChange={(event) => setField('nombre', event.target.value)} />
            </Field>}
            {!migrated.has('apellido') && <Field label={juridica ? 'Apellido de contacto' : 'Apellido'}>
              <input className={controlClass} value={form.apellido} required={!juridica} onChange={(event) => setField('apellido', event.target.value)} />
            </Field>}
          </div>}
          {(!migrated.has('documento') || !migrated.has('criticidad')) && <div className="grid gap-4 sm:grid-cols-2">
            {!migrated.has('documento') && <Field label={juridica ? 'CUIT' : 'DNI o CUIT'}>
              <input className={controlClass} value={form.documento} required inputMode="numeric" onChange={(event) => setField('documento', event.target.value)} />
            </Field>}
            {!migrated.has('criticidad') && <div className="flex min-w-0 flex-col gap-1.5 text-sm font-medium text-muted">
              Criticidad
              <CriticidadSelect value={form.criticidad} onChange={(value) => setField('criticidad', value)} />
            </div>}
          </div>}
          {!migrated.has('razonSocial') && <Field label="Razón social">
            <input className={controlClass} value={form.razonSocial} autoFocus={juridica} required={juridica} onChange={(event) => setField('razonSocial', event.target.value)} />
          </Field>}
          {(!migrated.has('poder') || !migrated.has('patrocinio')) && <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-muted">Representación</legend>
            <div className="flex flex-wrap gap-4">
              {!migrated.has('poder') && <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={Boolean(form.poder)}
                  onChange={(event) => setField('poder', event.target.checked)}
                />
                Poder
              </label>}
              {!migrated.has('patrocinio') && <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={Boolean(form.patrocinio)}
                  onChange={(event) => setField('patrocinio', event.target.checked)}
                />
                Patrocinio
              </label>}
            </div>
          </fieldset>}
          {fields.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <CustomFieldInput
                  key={field.id}
                  field={field}
                  value={(form.extras || {})[field.id]}
                  onChange={(value) => setForm((current) => ({
                    ...current,
                    ...(field.clave ? { [field.clave]: value } : {}),
                    extras: { ...(current.extras || {}), [field.id]: value },
                  }))}
                />
              ))}
            </div>
          )}
          {(!migrated.has('email') || !migrated.has('telefono')) && <div className="grid gap-4 sm:grid-cols-2">
            {!migrated.has('email') && <Field label="Mail">
              <input className={controlClass} type="email" value={form.email} autoComplete="off" onChange={(event) => setField('email', event.target.value)} />
            </Field>}
            {!migrated.has('telefono') && <Field label="Teléfono">
              <input className={controlClass} type="tel" value={form.telefono} inputMode="tel" onChange={(event) => setField('telefono', event.target.value)} />
            </Field>}
          </div>}
          {error && <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImportModal({ onClose, onImported }) {
  const titleId = useId()
  const [rows, setRows] = useState([])
  const [fileError, setFileError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const valid = rows.filter((row) => row.errors.length === 0)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    setResult(null)
    setFileError(null)
    setRows([])
    if (!file) return
    try {
      const buffer = await file.arrayBuffer()
      const parsed = parseClientWorkbook(buffer)
      setRows(parsed.rows)
      setFileError(parsed.error)
    } catch {
      setFileError('No se pudo leer el Excel.')
    }
  }

  async function handleImport() {
    setSaving(true)
    setFileError(null)
    try {
      const res = await importClientsRequest(valid.map((row) => ({
        row: row.row,
        tipo: row.tipo,
        nombre: row.nombre,
        apellido: row.apellido,
        documento: row.documento,
        razonSocial: row.razonSocial,
        email: row.email,
        telefono: row.telefono,
        criticidad: row.criticidad,
        poder: row.poder,
        patrocinio: row.patrocinio,
      })))
      setResult(res.data)
      await onImported()
    } catch (err) {
      setFileError(readError(err, 'No se pudo importar el Excel.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onClick={onClose}>
      <div
        className="flex max-h-[90dvh] w-full max-w-4xl flex-col rounded-2xl bg-surface p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 id={titleId} className="text-lg font-semibold text-ink">Importar clientes</h3>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </header>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-500">
            Elegir Excel
            <input className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} />
          </label>
          <Button variant="secondary" onClick={downloadClientTemplate}>Descargar modelo</Button>
          <Button disabled={!valid.length || saving} onClick={handleImport}>
            {saving ? 'Importando…' : `Importar ${valid.length || ''}`.trim()}
          </Button>
        </div>
        <p className="mt-3 text-sm text-muted">Columnas: Nombre, Apellido, DNI o CUIT, Razón social, Mail, Teléfono, Tipo (Física o Jurídica), Criticidad (Alta, Media o Baja), Poder y Patrocinio (Sí o No). Si el documento ya existe, se actualiza.</p>
        {fileError && <p className="mt-3 rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{fileError}</p>}
        {result && (
          <p className="mt-3 rounded-lg bg-chip-emerald px-3 py-2 text-sm text-chip-emerald-ink" role="status">
            {`Se agregaron ${result.created || 0} y se actualizaron ${result.updated || 0}.`}
            {result.errors?.length ? ` ${result.errors.length} filas no se importaron.` : ''}
          </p>
        )}
        {rows.length > 0 && (
          <div className="mt-4 overflow-auto rounded-2xl border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-sunken text-xs tracking-wide text-muted uppercase">
                <tr>
                  <th className="px-3 py-2 font-medium">Fila</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Documento</th>
                  <th className="px-3 py-2 font-medium">Tipo</th>
                  <th className="px-3 py-2 font-medium">Criticidad</th>
                  <th className="px-3 py-2 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.row}-${row.documento}`} className="border-t border-line">
                    <td className="px-3 py-2">{row.row}</td>
                    <td className="px-3 py-2">{clientName(row)}</td>
                    <td className="px-3 py-2">{row.documento || '—'}</td>
                    <td className="px-3 py-2">{row.tipo === 'juridica' ? 'Jurídica' : 'Física'}</td>
                    <td className="px-3 py-2"><CriticidadBadge value={row.criticidad} /></td>
                    <td className={`px-3 py-2 ${row.errors.length ? 'text-chip-red-ink' : 'text-chip-emerald-ink'}`}>
                      {row.errors.length ? row.errors.join(' ') : 'Listo'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [editor, setEditor] = useState(null)
  const [importing, setImporting] = useState(false)
  const [fields, setFields] = useState([])
  const [fieldsOpen, setFieldsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [tipo, setTipo] = useState('')
  const [criticidad, setCriticidad] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listClientsRequest()
      setClients(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(readError(err, 'No se pudieron cargar los clientes.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    listClientFieldsRequest()
      .then((res) => setFields(Array.isArray(res.data) ? res.data : []))
      .catch(() => setFields([]))
  }, [load])

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase()
    return clients.filter((client) => {
      if (tipo && client.tipo !== tipo) return false
      if (criticidad && client.criticidad !== criticidad) return false
      if (!text) return true
      return [client.nombre, client.apellido, client.documento, client.razonSocial, client.email, client.telefono, clientName(client)]
        .join(' ')
        .toLowerCase()
        .includes(text)
    })
  }, [clients, query, tipo, criticidad])

  async function handleSubmit(payload) {
    if (editor?.mode === 'edit') {
      await updateClientRequest(editor.client.id, payload)
      setNotice('Cliente actualizado.')
    } else {
      await createClientRequest(payload)
      setNotice('Cliente creado.')
    }
    setEditor(null)
    await load()
  }

  async function handleDelete(client) {
    const confirmed = await confirmDialog({
      title: '¿Eliminar el cliente?',
      text: clientName(client),
      confirmText: 'Eliminar',
    })
    if (!confirmed) return
    setError(null)
    setNotice(null)
    try {
      await deleteClientRequest(client.id)
      setNotice('Cliente eliminado.')
      await load()
    } catch (err) {
      setError(readError(err, 'No se pudo eliminar el cliente.'))
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Clientes</h2>
          <p className="mt-1 text-sm text-muted">Alta manual o importación desde Excel.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setFieldsOpen(true)}>Campos configurables</Button>
          <Button variant="secondary" onClick={() => setImporting(true)}>Importar Excel</Button>
          <Button variant="secondary" onClick={async () => {
            try {
              await logClientsExportRequest(clients.length)
            } catch {
              // la descarga sigue aunque el log no se haya guardado
            }
            downloadClientsExcel(clients, fields)
          }}>Exportar Excel</Button>
          <Button onClick={() => setEditor({ mode: 'create' })}>Nuevo cliente</Button>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-line bg-surface p-4 md:grid-cols-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Buscar
          <input className={controlClass} value={query} placeholder="Nombre, mail, teléfono o CUIT" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Tipo
          <select className={controlClass} value={tipo} onChange={(event) => setTipo(event.target.value)}>
            <option value="">Todos</option>
            <option value="fisica">Persona física</option>
            <option value="juridica">Persona jurídica</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
          Criticidad
          <select className={controlClass} value={criticidad} onChange={(event) => setCriticidad(event.target.value)}>
            <option value="">Todas</option>
            <option value="alta">Alta</option>
            <option value="media">Media</option>
            <option value="baja">Baja</option>
          </select>
        </label>
      </div>

      {error && <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-chip-emerald px-3 py-2 text-sm text-chip-emerald-ink" role="status">{notice}</p>}
      {loading && <p className="text-sm text-muted">Cargando…</p>}

      {!loading && visible.length === 0 && !error && (
        <p className="text-sm text-muted">{clients.length ? 'Ningún cliente coincide con el filtro.' : 'Todavía no hay clientes.'}</p>
      )}

      {!loading && visible.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="bg-sunken text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Tipo</th>
                <th className="px-4 py-2 font-medium">DNI o CUIT</th>
                <th className="px-4 py-2 font-medium">Razón social</th>
                <th className="px-4 py-2 font-medium">Mail</th>
                <th className="px-4 py-2 font-medium">Teléfono</th>
                <th className="px-4 py-2 font-medium">Representación</th>
                <th className="px-4 py-2 font-medium">Criticidad</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((client) => (
                <tr key={client.id} className="border-t border-line">
                  <td className="px-4 py-3 font-medium text-ink">{clientName(client)}</td>
                  <td className="px-4 py-3 text-muted">{client.tipo === 'juridica' ? 'Jurídica' : 'Física'}</td>
                  <td className="px-4 py-3 text-muted">{client.documento}</td>
                  <td className="px-4 py-3 text-muted">{client.razonSocial || '—'}</td>
                  <td className="px-4 py-3 text-muted">{client.email || '—'}</td>
                  <td className="px-4 py-3 text-muted">{client.telefono || '—'}</td>
                  <td className="px-4 py-3 text-muted">{representacionLabel(client)}</td>
                  <td className="px-4 py-3"><CriticidadBadge value={client.criticidad} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditor({ mode: 'edit', client })}
                      >
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(client)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editor && (
        <ClientFormModal
          mode={editor.mode}
          initial={editor.mode === 'edit' ? clientFormInitial(editor.client, fields) : EMPTY_FORM}
          fields={fields}
          onClose={() => setEditor(null)}
          onSubmit={handleSubmit}
        />
      )}
      {fieldsOpen && (
        <ClientFieldsModal onClose={() => { setFieldsOpen(false); load() }} onChange={setFields} />
      )}
      {importing && (
        <ImportModal
          onClose={() => setImporting(false)}
          onImported={async () => {
            setNotice('Importación guardada.')
            await load()
          }}
        />
      )}
    </section>
  )
}

export default ClientsPage

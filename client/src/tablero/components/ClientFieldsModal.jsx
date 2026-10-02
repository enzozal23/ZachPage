import { useEffect, useId, useState } from 'react'
import {
  createClientFieldRequest,
  deleteClientFieldRequest,
  listClientFieldsRequest,
  migrateClientFieldsRequest,
  updateClientFieldRequest,
} from '../../api/clients.js'
import { confirmDialog } from '../lib/dialog.js'
import { Button } from './ui/Button.jsx'
import { Field } from './ui/Field.jsx'
import { controlClass } from './ui/styles.js'

const EMPTY = { nombre: '', tipo: 'texto', orden: 1, requerido: false, opciones: '' }
const TYPE_LABEL = { texto: 'Texto', numero: 'Número', fecha: 'Fecha', checkbox: 'Checkbox', selector: 'Selector' }

function readError(error, fallback) {
  const message = error.response?.data?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

function ClientFieldsModal({ onClose, onChange }) {
  const titleId = useId()
  const [fields, setFields] = useState([])
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    const res = await listClientFieldsRequest()
    const next = Array.isArray(res.data) ? res.data : []
    setFields(next)
    onChange(next)
  }

  useEffect(() => {
    load().catch((err) => setError(readError(err, 'No se pudieron cargar los campos.')))
  }, [])

  function openCreate() {
    const nextOrden = fields.reduce((max, field) => Math.max(max, Number(field.orden) || 0), 0) + 1
    setForm({ ...EMPTY, orden: nextOrden })
    setEditor({ mode: 'create' })
    setError(null)
  }

  function openEdit(field) {
    setForm({
      nombre: field.nombre,
      tipo: field.tipo,
      orden: field.orden,
      requerido: field.requerido,
      opciones: (field.opciones || []).map((option) => option.label || option.value || option).join(', '),
      clave: field.clave || '',
    })
    setEditor({ mode: 'edit', id: field.id })
    setError(null)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const payload = {
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      orden: Number(form.orden),
      requerido: Boolean(form.requerido),
      opciones: form.opciones,
    }
    try {
      if (editor?.mode === 'edit') await updateClientFieldRequest(editor.id, payload)
      else await createClientFieldRequest(payload)
      setEditor(null)
      await load()
    } catch (err) {
      setError(readError(err, 'No se pudo guardar el campo.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleMigrate() {
    const confirmed = await confirmDialog({
      title: '¿Migrar los campos actuales?',
      text: 'Nombre, apellido, DNI o CUIT, razón social, mail, teléfono, tipo, criticidad, poder y patrocinio pasan a ser campos configurables. Se copian los datos de los clientes que ya existen y no se borran.',
      confirmText: 'Migrar',
    })
    if (!confirmed) return
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const res = await migrateClientFieldsRequest()
      setNotice(`Se migraron los datos de ${res.data?.clients || 0} clientes.`)
      await load()
    } catch (err) {
      setError(readError(err, 'No se pudieron migrar los campos.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(field) {
    const confirmed = await confirmDialog({
      title: '¿Eliminar el campo?',
      text: field.nombre,
      confirmText: 'Eliminar',
    })
    if (!confirmed) return
    setError(null)
    try {
      await deleteClientFieldRequest(field.id)
      await load()
    } catch (err) {
      setError(readError(err, 'No se pudo eliminar el campo.'))
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onClick={onClose}>
      <div
        className="flex max-h-[90dvh] w-full max-w-3xl flex-col rounded-2xl bg-surface p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 id={titleId} className="text-lg font-semibold text-ink">Campos configurables</h3>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleMigrate} disabled={saving}>Migrar campos actuales</Button>
            <Button onClick={openCreate}>Nuevo campo</Button>
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </header>
        <p className="text-sm text-muted">Estos campos se agregan al alta y a la edición de cada cliente.</p>
        {error && <p className="mt-3 rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>}
        {notice && <p className="mt-3 rounded-lg bg-chip-emerald px-3 py-2 text-sm text-chip-emerald-ink" role="status">{notice}</p>}
        <div className="mt-4 overflow-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-sunken text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-3 py-2 font-medium">Orden</th>
                <th className="px-3 py-2 font-medium">Nombre</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Requerido</th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {fields.length === 0 && (
                <tr>
                  <td className="px-3 py-3 text-muted" colSpan={5}>Todavía no hay campos configurables.</td>
                </tr>
              )}
              {fields.map((field) => (
                <tr key={field.id} className="border-t border-line">
                  <td className="px-3 py-2">{field.orden}</td>
                  <td className="px-3 py-2 font-medium text-ink">
                    {field.nombre}
                    {field.clave ? <span className="ml-2 text-xs font-normal text-muted">Dato existente</span> : null}
                  </td>
                  <td className="px-3 py-2 text-muted">{TYPE_LABEL[field.tipo] || field.tipo}</td>
                  <td className="px-3 py-2 text-muted">{field.requerido ? 'Sí' : 'No'}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => openEdit(field)}>Editar</Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(field)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editor && (
          <form className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <Field label="Nombre">
              <input className={controlClass} value={form.nombre} required autoFocus onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} />
            </Field>
            <Field label="Tipo">
              <select className={controlClass} value={form.tipo} disabled={Boolean(form.clave)} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))}>
                <option value="texto">Texto</option>
                <option value="numero">Número</option>
                <option value="fecha">Fecha</option>
                <option value="checkbox">Checkbox</option>
                <option value="selector">Selector</option>
              </select>
            </Field>
            <Field label="Orden">
              <input className={controlClass} type="number" value={form.orden} required onChange={(event) => setForm((current) => ({ ...current, orden: event.target.value }))} />
            </Field>
            <label className="flex items-end gap-2 pb-2 text-sm text-ink">
              <input type="checkbox" checked={Boolean(form.requerido)} onChange={(event) => setForm((current) => ({ ...current, requerido: event.target.checked }))} />
              Requerido
            </label>
            {form.tipo === 'selector' && !form.clave && (
              <Field className="sm:col-span-2" label="Opciones">
                <input className={controlClass} value={form.opciones} placeholder="Separadas por coma" onChange={(event) => setForm((current) => ({ ...current, opciones: event.target.value }))} />
              </Field>
            )}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button variant="secondary" onClick={() => setEditor(null)}>Cancelar</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar campo'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default ClientFieldsModal

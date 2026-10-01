import { useCallback, useEffect, useId, useState } from 'react'
import {
  clearUserSearchCache,
  createUserRequest,
  deleteUserRequest,
  listAllUsersRequest,
  updateUserRequest,
} from '../../api/auth.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { Button } from './ui/Button.jsx'
import { confirmDialog } from '../lib/dialog.js'
import { Field } from './ui/Field.jsx'
import { controlClass } from './ui/styles.js'

const EMPTY_FORM = { username: '', email: '', password: '' }

function readError(error, fallback) {
  const data = error.response?.data
  if (Array.isArray(data)) return data.filter(Boolean).join(' ')
  if (typeof data?.message === 'string' && data.message.trim()) return data.message
  return fallback
}

function UserFormModal({ mode, initial, onClose, onSubmit }) {
  const titleId = useId()
  const [form, setForm] = useState(initial)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const editing = mode === 'edit'

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      })
    } catch (err) {
      setError(readError(err, 'No se pudo guardar el usuario.'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h3 id={titleId} className="text-lg font-semibold text-ink">{editing ? 'Editar usuario' : 'Nuevo usuario'}</h3>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </header>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <Field label="Nombre">
            <input
              className={controlClass}
              value={form.username}
              autoFocus
              required
              onChange={(event) => setField('username', event.target.value)}
            />
          </Field>
          <Field label="Mail">
            <input
              className={controlClass}
              type="email"
              value={form.email}
              required
              autoComplete="off"
              onChange={(event) => setField('email', event.target.value)}
            />
          </Field>
          <Field label={editing ? 'Contraseña nueva' : 'Contraseña'}>
            <input
              className={controlClass}
              type="password"
              value={form.password}
              required={!editing}
              minLength={form.password ? 6 : undefined}
              autoComplete="new-password"
              placeholder={editing ? 'Vacío para no cambiarla' : 'Mínimo 6 caracteres'}
              onChange={(event) => setField('password', event.target.value)}
            />
          </Field>
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

function UsersPage() {
  const { user, refreshProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [editor, setEditor] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await listAllUsersRequest()
      setUsers(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setError(readError(err, 'No se pudieron cargar los usuarios.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleSubmit(payload) {
    if (editor?.mode === 'edit') {
      await updateUserRequest(editor.user.id, payload)
      if (String(editor.user.id) === String(user?.id)) await refreshProfile()
      setNotice('Usuario actualizado.')
    } else {
      await createUserRequest(payload)
      setNotice('Usuario creado.')
    }
    clearUserSearchCache()
    setEditor(null)
    await load()
  }

  async function handleDelete(account) {
    const confirmed = await confirmDialog({
      title: '¿Eliminar el usuario?',
      text: account.username || account.email || '',
      confirmText: 'Eliminar',
    })
    if (!confirmed) return
    setError(null)
    setNotice(null)
    try {
      await deleteUserRequest(account.id)
      clearUserSearchCache()
      setNotice('Usuario eliminado.')
      await load()
    } catch (err) {
      setError(readError(err, 'No se pudo eliminar el usuario.'))
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-6 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Usuarios</h2>
          <p className="mt-1 text-sm text-muted">Alta, edición y baja de quienes entran a Lexora.</p>
        </div>
        <Button onClick={() => setEditor({ mode: 'create' })}>Nuevo usuario</Button>
      </div>

      {error && <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-chip-emerald px-3 py-2 text-sm text-chip-emerald-ink" role="status">{notice}</p>}
      {loading && <p className="text-sm text-muted">Cargando…</p>}

      {!loading && users.length === 0 && !error && (
        <p className="text-sm text-muted">Todavía no hay usuarios.</p>
      )}

      {!loading && users.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-sunken text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Mail</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((account) => {
                const isSelf = String(account.id) === String(user?.id)
                return (
                  <tr key={account.id} className="border-t border-line">
                    <td className="px-4 py-3 font-medium text-ink">
                      {account.username || 'Sin nombre'}
                      {isSelf && <span className="ml-2 text-xs font-normal text-muted">Vos</span>}
                    </td>
                    <td className="px-4 py-3 text-muted">{account.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditor({
                            mode: 'edit',
                            user: account,
                          })}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={isSelf}
                          title={isSelf ? 'No podés eliminar tu propio usuario' : undefined}
                          onClick={() => handleDelete(account)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {editor && (
        <UserFormModal
          mode={editor.mode}
          initial={editor.mode === 'edit'
            ? { username: editor.user.username || '', email: editor.user.email || '', password: '' }
            : EMPTY_FORM}
          onClose={() => setEditor(null)}
          onSubmit={handleSubmit}
        />
      )}
    </section>
  )
}

export default UsersPage

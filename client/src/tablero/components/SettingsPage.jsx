import { useEffect, useId, useState } from 'react'
import { getSettingsRequest, saveSettingsRequest } from '../../api/settings.js'
import { Button } from './ui/Button.jsx'
import { controlClass } from './ui/styles.js'
import {
  DEFAULT_DAYS_BEFORE,
  REMINDER_PRIORITIES,
  REMINDER_STATUSES,
  normalizeDueReminderRules,
  priorityMeta,
  publicSettings,
  statusLabel,
  statusMeta,
} from '../lib/dueReminderSettings.js'

const SECTIONS = [
  { id: 'due-reminders', title: 'Avisos de vencimiento' },
]

function ruleKey(status, priority) {
  return `${status}::${priority}`
}

function availablePrioritiesFor(status, existingKeys) {
  return REMINDER_PRIORITIES.filter((entry) => !existingKeys.has(ruleKey(status, entry.id)))
}

function availableStatuses(existingKeys) {
  return REMINDER_STATUSES.filter((status) => availablePrioritiesFor(status.id, existingKeys).length > 0)
}

function RuleModal({ onClose, onAdd, existingKeys }) {
  const titleId = useId()
  const statuses = availableStatuses(existingKeys)
  const initialStatus = statuses[0]?.id || ''
  const initialPriorities = availablePrioritiesFor(initialStatus, existingKeys)
  const [status, setStatus] = useState(initialStatus)
  const [priority, setPriority] = useState(initialPriorities[0]?.id || '')
  const [daysBefore, setDaysBefore] = useState(DEFAULT_DAYS_BEFORE)
  const [formError, setFormError] = useState(null)

  const priorities = availablePrioritiesFor(status, existingKeys)
  const selectedStatus = statusMeta(status)
  const selectedPriority = priorityMeta(priority)
  const duplicate = Boolean(status && priority && existingKeys.has(ruleKey(status, priority)))
  const canSubmit = Boolean(status && priority && !duplicate)

  function handleStatusChange(nextStatus) {
    setStatus(nextStatus)
    const nextPriorities = availablePrioritiesFor(nextStatus, existingKeys)
    setPriority(nextPriorities[0]?.id || '')
    setFormError(null)
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!status || !priority) {
      setFormError('Elegí estado y prioridad.')
      return
    }
    if (existingKeys.has(ruleKey(status, priority))) {
      setFormError('Ya existe una configuración para ese estado y prioridad.')
      return
    }
    const days = Number(daysBefore)
    onAdd({
      status,
      priority,
      daysBefore: Number.isFinite(days) ? Math.max(0, Math.min(365, Math.round(days))) : DEFAULT_DAYS_BEFORE,
    })
  }

  if (!statuses.length) {
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
            <h3 id={titleId} className="text-lg font-semibold text-ink">Agregar configuración</h3>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </header>
          <p className="text-sm text-muted">
            Ya hay una configuración para todas las combinaciones de estado y prioridad.
          </p>
        </div>
      </div>
    )
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
          <h3 id={titleId} className="text-lg font-semibold text-ink">Agregar configuración</h3>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </header>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
            <span>Estado de tarjeta</span>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-6 w-6 shrink-0 rounded-full border"
                style={{
                  background: selectedStatus?.bg,
                  color: selectedStatus?.color,
                  borderColor: selectedStatus?.color,
                }}
                aria-hidden="true"
              />
              <select
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className={controlClass}
              >
                {statuses.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
            <span>Prioridad</span>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex h-6 w-6 shrink-0 rounded-full border"
                style={{
                  background: selectedPriority?.bg,
                  color: selectedPriority?.color,
                  borderColor: selectedPriority?.color,
                }}
                aria-hidden="true"
              />
              <select
                value={priority}
                onChange={(event) => {
                  setPriority(event.target.value)
                  setFormError(null)
                }}
                className={controlClass}
              >
                {priorities.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.id}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
            <span>Días antes de la notificación</span>
            <input
              className={controlClass}
              type="number"
              min="0"
              max="365"
              value={daysBefore}
              onChange={(event) => setDaysBefore(event.target.value)}
            />
          </label>

          {formError && <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{formError}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SettingsPage() {
  const [openSection, setOpenSection] = useState('due-reminders')
  const [rules, setRules] = useState([])
  const [mailEnabled, setMailEnabled] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await getSettingsRequest()
        if (cancelled) return
        const settings = publicSettings(res.data)
        setRules(settings.dueReminders)
        setMailEnabled(settings.mailNotificationsEnabled)
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'No se pudo cargar la configuración.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const existingKeys = new Set(rules.map((rule) => ruleKey(rule.status, rule.priority)))
  const hasAvailableCombos = availableStatuses(existingKeys).length > 0

  function addRule(rule) {
    const key = ruleKey(rule.status, rule.priority)
    setRules((current) => {
      if (current.some((item) => ruleKey(item.status, item.priority) === key)) return current
      return normalizeDueReminderRules([...current, rule])
    })
    setModalOpen(false)
    setNotice(null)
  }

  function removeRule(status, priority) {
    setRules((current) =>
      current.filter((rule) => !(rule.status === status && rule.priority === priority)),
    )
  }

  async function handleSave(event) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const res = await saveSettingsRequest({
        mailNotificationsEnabled: mailEnabled,
        dueReminders: rules,
      })
      const settings = publicSettings(res.data)
      setRules(settings.dueReminders)
      setMailEnabled(settings.mailNotificationsEnabled)
      setNotice('Configuración guardada.')
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-1 flex-col gap-4 px-6 py-5">
      <div>
        <h2 className="text-xl font-semibold text-ink">Configuraciones</h2>
        <p className="mt-1 text-sm text-muted">Parámetros generales del tablero Lexora.</p>
      </div>

      {error && <p className="rounded-lg bg-chip-red px-3 py-2 text-sm text-chip-red-ink" role="alert">{error}</p>}
      {notice && <p className="rounded-lg bg-chip-emerald px-3 py-2 text-sm text-chip-emerald-ink" role="status">{notice}</p>}
      {loading && <p className="text-sm text-muted">Cargando…</p>}

      {!loading && (
        <div className="flex flex-col gap-3">
          {SECTIONS.map((section) => {
            const isOpen = openSection === section.id
            return (
              <div key={section.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-semibold text-ink"
                  aria-expanded={isOpen}
                  onClick={() => setOpenSection(isOpen ? '' : section.id)}
                >
                  <span>{section.title}</span>
                  <span className={`text-muted transition ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">▾</span>
                </button>

                {isOpen && section.id === 'due-reminders' && (
                  <form className="flex flex-col gap-4 border-t border-line px-5 py-4" onSubmit={handleSave}>
                    <label className="flex items-center justify-between gap-4">
                      <span className="flex flex-col">
                        <strong className="text-ink">Notificaciones por mail</strong>
                        <span className="text-sm text-muted">
                          {mailEnabled
                            ? 'Los avisos de vencimiento se envían según las reglas.'
                            : 'Los avisos de vencimiento están desactivados.'}
                        </span>
                      </span>
                      <span className="relative inline-flex shrink-0">
                        <input
                          type="checkbox"
                          role="switch"
                          className="peer sr-only"
                          checked={mailEnabled}
                          onChange={(event) => setMailEnabled(event.target.checked)}
                          aria-label="Activar notificaciones por mail"
                        />
                        <span className="h-6 w-11 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600" aria-hidden="true" />
                        <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface transition peer-checked:translate-x-5" aria-hidden="true" />
                      </span>
                    </label>

                    <p className="text-sm text-muted">
                      Si no hay reglas, el aviso se envía con 1 día de anticipación (hoy o mañana
                      según el vencimiento). Con reglas, solo aplican las combinaciones de estado y
                      prioridad configuradas (0 = solo el día de vencimiento).
                    </p>

                    <div>
                      <Button
                        onClick={() => setModalOpen(true)}
                        disabled={!hasAvailableCombos}
                        title={
                          hasAvailableCombos
                            ? undefined
                            : 'Ya hay una configuración para todas las combinaciones'
                        }
                      >
                        Agregar configuración
                      </Button>
                    </div>

                    {rules.length === 0 ? (
                      <p className="text-sm text-muted">Todavía no hay configuraciones.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-xs tracking-wide text-muted uppercase">
                            <tr>
                              <th className="px-2 py-2 font-medium">Estado</th>
                              <th className="px-2 py-2 font-medium">Prioridad</th>
                              <th className="px-2 py-2 font-medium">Días antes</th>
                              <th className="px-2 py-2 font-medium">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rules.map((rule) => {
                              const status = statusMeta(rule.status)
                              const priority = priorityMeta(rule.priority)
                              return (
                                <tr key={`${rule.status}-${rule.priority}`} className="border-t border-line">
                                  <td className="px-2 py-2">
                                    <span
                                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                      style={{
                                        background: status?.bg,
                                        color: status?.color,
                                      }}
                                    >
                                      {statusLabel(rule.status)}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2">
                                    <span
                                      className="rounded-full px-2 py-0.5 text-xs font-semibold"
                                      style={{
                                        background: priority?.bg,
                                        color: priority?.color,
                                      }}
                                    >
                                      {rule.priority}
                                    </span>
                                  </td>
                                  <td className="px-2 py-2">
                                    {rule.daysBefore} {rule.daysBefore === 1 ? 'día' : 'días'}
                                  </td>
                                  <td className="px-2 py-2">
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => removeRule(rule.status, rule.priority)}
                                    >
                                      Quitar
                                    </Button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'Guardando…' : 'Guardar'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <RuleModal
          existingKeys={existingKeys}
          onClose={() => setModalOpen(false)}
          onAdd={addRule}
        />
      )}
    </section>
  )
}

export default SettingsPage

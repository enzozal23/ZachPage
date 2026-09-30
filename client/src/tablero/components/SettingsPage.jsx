import { useEffect, useId, useState } from 'react'
import { getSettingsRequest, saveSettingsRequest } from '../../api/settings.js'
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
      <div className="modal-overlay" role="presentation" onClick={onClose}>
        <div
          className="modal settings-rule-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="settings-rule-modal-header">
            <h3 id={titleId}>Agregar configuración</h3>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </header>
          <p className="settings-hint">
            Ya hay una configuración para todas las combinaciones de estado y prioridad.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal settings-rule-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="settings-rule-modal-header">
          <h3 id={titleId}>Agregar configuración</h3>
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </header>

        <form className="settings-rule-form" onSubmit={handleSubmit}>
          <label>
            <span>Estado de tarjeta</span>
            <div className="settings-select-with-swatch">
              <span
                className="settings-status-swatch"
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
                className={`settings-status-select is-${status}`}
              >
                {statuses.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label>
            <span>Prioridad</span>
            <div className="settings-select-with-swatch">
              <span
                className="settings-status-swatch"
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
                className={`settings-priority-select is-${String(priority).toLowerCase()}`}
              >
                {priorities.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.id}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label>
            <span>Días antes de la notificación</span>
            <input
              type="number"
              min="0"
              max="365"
              value={daysBefore}
              onChange={(event) => setDaysBefore(event.target.value)}
            />
          </label>

          {formError && <p className="import-error" role="alert">{formError}</p>}

          <div className="settings-rule-form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" disabled={!canSubmit}>
              Agregar
            </button>
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
    <section className="settings-page">
      <div className="settings-hero">
        <div>
          <h2>Configuraciones</h2>
          <p>Parámetros generales del tablero Lexora.</p>
        </div>
      </div>

      {error && <p className="import-error" role="alert">{error}</p>}
      {notice && <p className="import-notice" role="status">{notice}</p>}
      {loading && <p className="settings-empty">Cargando…</p>}

      {!loading && (
        <div className="settings-accordions">
          {SECTIONS.map((section) => {
            const isOpen = openSection === section.id
            return (
              <div key={section.id} className={`settings-accordion${isOpen ? ' is-open' : ''}`}>
                <button
                  type="button"
                  className="settings-accordion-trigger"
                  aria-expanded={isOpen}
                  onClick={() => setOpenSection(isOpen ? '' : section.id)}
                >
                  <span>{section.title}</span>
                  <span className="settings-accordion-chevron" aria-hidden="true" />
                </button>

                {isOpen && section.id === 'due-reminders' && (
                  <form className="settings-accordion-body" onSubmit={handleSave}>
                    <label className={`settings-switch${mailEnabled ? ' is-on' : ''}`}>
                      <span className="settings-switch-copy">
                        <strong>Notificaciones por mail</strong>
                        <span>
                          {mailEnabled
                            ? 'Los avisos de vencimiento se envían según las reglas.'
                            : 'Los avisos de vencimiento están desactivados.'}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        role="switch"
                        checked={mailEnabled}
                        onChange={(event) => setMailEnabled(event.target.checked)}
                        aria-label="Activar notificaciones por mail"
                      />
                      <span className="settings-switch-track" aria-hidden="true">
                        <span className="settings-switch-thumb" />
                      </span>
                    </label>

                    <p className="settings-hint">
                      Si no hay reglas, el aviso se envía con 1 día de anticipación (hoy o mañana
                      según el vencimiento). Con reglas, solo aplican las combinaciones de estado y
                      prioridad configuradas (0 = solo el día de vencimiento).
                    </p>

                    <div className="settings-rules-toolbar">
                      <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        disabled={!hasAvailableCombos}
                        title={
                          hasAvailableCombos
                            ? undefined
                            : 'Ya hay una configuración para todas las combinaciones'
                        }
                      >
                        Agregar configuración
                      </button>
                    </div>

                    {rules.length === 0 ? (
                      <p className="settings-empty">Todavía no hay configuraciones.</p>
                    ) : (
                      <div className="settings-table-wrap">
                        <table className="settings-table">
                          <thead>
                            <tr>
                              <th>Estado</th>
                              <th>Prioridad</th>
                              <th>Días antes</th>
                              <th>Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rules.map((rule) => {
                              const status = statusMeta(rule.status)
                              const priority = priorityMeta(rule.priority)
                              return (
                                <tr key={`${rule.status}-${rule.priority}`}>
                                  <td>
                                    <span
                                      className="settings-rule-badge"
                                      style={{
                                        background: status?.bg,
                                        color: status?.color,
                                      }}
                                    >
                                      {statusLabel(rule.status)}
                                    </span>
                                  </td>
                                  <td>
                                    <span
                                      className="settings-rule-badge"
                                      style={{
                                        background: priority?.bg,
                                        color: priority?.color,
                                      }}
                                    >
                                      {rule.priority}
                                    </span>
                                  </td>
                                  <td>
                                    {rule.daysBefore} {rule.daysBefore === 1 ? 'día' : 'días'}
                                  </td>
                                  <td>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      onClick={() => removeRule(rule.status, rule.priority)}
                                    >
                                      Quitar
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="settings-actions">
                      <button type="submit" disabled={saving}>
                        {saving ? 'Guardando…' : 'Guardar'}
                      </button>
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

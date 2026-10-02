import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadStoredState, createDefaultState, clearStorage, renameLegacyBoards } from '../lib/storage.js'
import { getKanbanRequest, saveKanbanRequest } from '../../api/kanban.js'
import { DEFAULT_COLUMN_ID, DEFAULT_PRIORITY, PENDING_COLUMN_ID, needsAssignment } from '../constants/columns.js'
import { assigneeFields, ticketAssignees } from '../lib/assignees.js'
import { ticketTasks } from '../lib/tasks.js'
import { packKanban, resolveExpediente, unpackKanban } from '../lib/persist.js'
import { ticketBelongsToImport } from '../lib/importTickets.js'
import { normalizeFilters } from '../lib/boardFilters.js'

const SELECTED_KEY = 'tablero-kanban:selectedBoardId'

function mergeLocalTicketFields(localTickets, remoteTickets) {
  const byId = new Map((localTickets || []).map((ticket) => [ticket.id, ticket]))
  return (remoteTickets || []).map((ticket) => {
    const local = byId.get(ticket.id)
    const expediente = resolveExpediente(ticket) || resolveExpediente(local || {})
    if (!expediente || ticket.expediente === expediente) return ticket
    return { ...ticket, expediente }
  })
}

function readSelected() {
  try {
    return localStorage.getItem(SELECTED_KEY) || ''
  } catch {
    return ''
  }
}

function writeSelected(id) {
  try {
    if (id) localStorage.setItem(SELECTED_KEY, id)
  } catch {
    // el tablero sigue usable si el navegador bloquea storage
  }
}

function pickSelected(boards, tickets, preferred) {
  const hasTickets = (boardId) => (tickets || []).some((ticket) => ticket.boardId === boardId)
  if (preferred && boards.some((board) => board.id === preferred) && (hasTickets(preferred) || !(tickets || []).length)) {
    return preferred
  }
  const withTickets = boards.find((board) => hasTickets(board.id))
  if (withTickets) return withTickets.id
  if (preferred && boards.some((board) => board.id === preferred)) return preferred
  return boards[0]?.id || null
}

function unionTickets(primary, extra) {
  const byId = new Map((primary || []).map((ticket) => [ticket.id, ticket]))
  for (const ticket of extra || []) {
    if (ticket?.id && !byId.has(ticket.id)) byId.set(ticket.id, ticket)
  }
  return [...byId.values()]
}

function saveErrorMessage(error) {
  const status = error?.response?.status
  if (status === 413) return 'No se pudo guardar en el servidor: el envío es demasiado grande.'
  const message = error?.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message
  if (status) return `No se pudo guardar en el servidor (${status}).`
  return 'No se pudo guardar en el servidor.'
}

function longer(next, current) {
  return (next || []).length > (current || []).length
}

function mergeStored(remote, stored) {
  const tickets = (remote.tickets || []).map((ticket) => ({ ...ticket }))
  const byId = new Map(tickets.map((ticket) => [ticket.id, ticket]))
  let changed = false

  for (const local of stored.tickets || []) {
    const current = byId.get(local.id)
    if (!current) {
      byId.set(local.id, local)
      changed = true
      continue
    }
    if (longer(ticketTasks(local), ticketTasks(current))) {
      current.tasks = ticketTasks(local)
      current.task = ''
      changed = true
    }
    if (longer(local.comments, current.comments)) {
      current.comments = local.comments
      changed = true
    }
    if (longer(ticketAssignees(local), ticketAssignees(current))) {
      const names = ticketAssignees(local)
      current.assignees = names
      current.assignee = names[0] || ''
      changed = true
    }
    if (longer(local.followers, current.followers)) {
      current.followers = local.followers
      changed = true
    }
  }

  let imports = remote.imports || []
  if (longer(stored.imports, imports)) {
    imports = stored.imports
    changed = true
  }

  return {
    changed,
    state: { boards: remote.boards, tickets: [...byId.values()], imports },
  }
}

export function useKanbanStore(enabled = false) {
  const [state, setState] = useState(null)
  const [ready, setReady] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const dirty = useRef(false)
  const revision = useRef(0)
  const stateRef = useRef(null)
  stateRef.current = state

  useEffect(() => {
    if (!enabled) return undefined
    let cancelled = false

    async function load() {
      const stored = loadStoredState()
      try {
        const res = await getKanbanRequest()
        let remote = unpackKanban(res.data)
        let mustSave = false

        const renamed = renameLegacyBoards(remote.boards)
        if (renamed.changed) {
          remote = { ...remote, boards: renamed.boards }
          mustSave = true
        }

        if (!remote.boards.length) {
          if (stored?.boards?.length) {
            remote = {
              boards: stored.boards,
              tickets: unionTickets(stored.tickets, remote.tickets),
              imports: (stored.imports || []).length ? stored.imports : remote.imports,
            }
          } else if (remote.tickets.length) {
            const created = createDefaultState()
            remote = {
              boards: created.boards,
              tickets: remote.tickets.map((ticket) => ({
                ...ticket,
                boardId: ticket.boardId || created.boards[0].id,
              })),
              imports: remote.imports || [],
            }
          } else {
            const created = createDefaultState()
            remote = { boards: created.boards, tickets: [], imports: [] }
          }
          mustSave = true
        } else if (stored) {
          const merged = mergeStored(remote, stored)
          remote = merged.state
          mustSave = merged.changed
        }

        if (cancelled) return
        const selectedBoardId = pickSelected(remote.boards, remote.tickets, readSelected() || stored?.selectedBoardId)
        writeSelected(selectedBoardId)
        dirty.current = false
        setState({ ...remote, selectedBoardId })
        setSaveError(null)

        if (mustSave) {
          const sent = remote.tickets.length
          try {
            const saved = await saveKanbanRequest(packKanban(remote))
            if (cancelled) return
            const next = unpackKanban(saved.data)
            next.tickets = mergeLocalTicketFields(remote.tickets, next.tickets)
            if (next.tickets.length < sent) {
              setSaveError('El servidor no confirmó todas las tarjetas.')
              return
            }
            clearStorage()
            const nextBoardId = pickSelected(next.boards, next.tickets, selectedBoardId)
            writeSelected(nextBoardId)
            dirty.current = false
            setState({ ...next, selectedBoardId: nextBoardId })
          } catch (error) {
            if (!cancelled) setSaveError(saveErrorMessage(error))
          }
        } else {
          clearStorage()
        }
      } catch {
        if (cancelled) return
        if (stored?.boards?.length) {
          const selectedBoardId = pickSelected(stored.boards, stored.tickets, readSelected() || stored.selectedBoardId)
          writeSelected(selectedBoardId)
          setState({ ...stored, selectedBoardId })
          setSaveError('No se pudo leer el servidor. Se muestran las tarjetas de este navegador.')
        } else {
          setSaveError('No se pudo leer el tablero del servidor.')
          setState(null)
        }
      } finally {
        if (!cancelled) setReady(true)
      }
    }

    setReady(false)
    setSaveError(null)
    load()
    return () => {
      cancelled = true
    }
  }, [enabled])

  useEffect(() => {
    if (!ready || !state || !dirty.current) return
    const revisionAtSave = revision.current
    const snapshot = state
    const handle = setTimeout(() => {
      saveKanbanRequest(packKanban(snapshot))
        .then((res) => {
          if (revision.current !== revisionAtSave) return
          const next = unpackKanban(res.data)
          next.tickets = mergeLocalTicketFields(snapshot.tickets, next.tickets)
          if ((next.tickets || []).length < (snapshot.tickets || []).length) {
            setSaveError('El servidor no confirmó todas las tarjetas.')
            return
          }
          dirty.current = false
          setSaveError(null)
          setState((prev) => ({
            ...next,
            selectedBoardId: pickSelected(next.boards, next.tickets, prev?.selectedBoardId),
          }))
        })
        .catch((error) => {
          if (revision.current !== revisionAtSave) return
          setSaveError(saveErrorMessage(error))
        })
    }, 500)
    return () => clearTimeout(handle)
  }, [state, ready])

  const update = useCallback((recipe) => {
    revision.current += 1
    dirty.current = true
    setState((prev) => recipe(prev))
  }, [])

  const selectedBoardId = state?.selectedBoardId

  const tickets = useMemo(() => {
    const all = state?.tickets || []
    const onBoard = all.filter((ticket) => ticket.boardId === selectedBoardId)
    if (onBoard.length || !all.length) return onBoard
    const known = new Set((state?.boards || []).map((board) => board.id))
    const orphans = all.filter((ticket) => !known.has(ticket.boardId))
    return orphans.length ? orphans : onBoard
  }, [state?.tickets, state?.boards, selectedBoardId])

  const createBoard = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const board = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    }
    update((prev) => ({
      ...prev,
      boards: [...prev.boards, board],
      selectedBoardId: board.id,
    }))
    writeSelected(board.id)
  }, [update])

  const selectBoard = useCallback((boardId) => {
    writeSelected(boardId)
    setState((prev) => ({ ...prev, selectedBoardId: boardId }))
  }, [])

  const saveBoardFilters = useCallback((boardId, filters) => {
    if (!boardId) return
    update((prev) => ({
      ...prev,
      boards: (prev.boards || []).map((board) => (
        board.id === boardId
          ? { ...board, filters: normalizeFilters(filters) }
          : board
      )),
    }))
  }, [update])

  const createTicket = useCallback((data) => {
    update((prev) => {
      const ticket = {
        id: crypto.randomUUID(),
        boardId: prev.selectedBoardId,
        title: data.title.trim(),
        description: (data.description || '').trim(),
        status: data.status || DEFAULT_COLUMN_ID,
        ...assigneeFields(data.assignees ?? data.assignee),
        followers: Array.isArray(data.followers) ? data.followers : [],
        priority: data.priority || DEFAULT_PRIORITY,
        labels: data.labels || [],
        dueDate: data.dueDate || '',
        expediente: String(data.expediente || '').trim(),
        clientId: String(data.clientId || '').trim(),
        clientName: String(data.clientName || '').trim(),
        task: '',
        tasks: Array.isArray(data.tasks) ? data.tasks : [],
        createdAt: new Date().toISOString(),
        source: 'manual',
        comments: [],
      }
      return { ...prev, tickets: [...prev.tickets, ticket] }
    })
  }, [update])

  const updateTicket = useCallback((id, data) => {
    update((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) => {
        if (ticket.id !== id) return ticket
        const next = { ...ticket, ...data }
        if (Object.prototype.hasOwnProperty.call(data, 'assignees') || Object.prototype.hasOwnProperty.call(data, 'assignee')) {
          Object.assign(next, assigneeFields(data.assignees ?? data.assignee ?? next.assignees ?? next.assignee))
        }
        if (needsAssignment(next)) {
          next.status = PENDING_COLUMN_ID
        } else if (next.status === PENDING_COLUMN_ID) {
          next.status = 'todo'
        }
        return next
      }),
    }))
  }, [update])

  const moveTicket = useCallback((id, status) => {
    update((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) => {
        if (ticket.id !== id) return ticket
        const next = { ...ticket, status }
        if (needsAssignment(next)) {
          return { ...next, status: PENDING_COLUMN_ID }
        }
        if (status === PENDING_COLUMN_ID) {
          return { ...next, status: 'todo' }
        }
        return next
      }),
    }))
  }, [update])

  const deleteTicket = useCallback((id) => {
    update((prev) => ({ ...prev, tickets: prev.tickets.filter((ticket) => ticket.id !== id) }))
  }, [update])

  const importTickets = useCallback((partialTickets) => {
    const now = new Date().toISOString()
    const boardId = stateRef.current?.selectedBoardId
    const created = partialTickets.map((ticket) => ({
      id: crypto.randomUUID(),
      boardId,
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status || DEFAULT_COLUMN_ID,
        ...assigneeFields(ticket.assignees ?? ticket.assignee),
        followers: Array.isArray(ticket.followers) ? ticket.followers : [],
      priority: ticket.priority || DEFAULT_PRIORITY,
      labels: ticket.labels || [],
      dueDate: ticket.dueDate || '',
      expediente: String(ticket.expediente || '').trim(),
      task: '',
      tasks: [],
      createdAt: now,
      source: 'word',
      comments: [],
    }))
    update((prev) => ({ ...prev, tickets: [...prev.tickets, ...created] }))
    return created
  }, [update])

  const addTicketTask = useCallback((id, text) => {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    update((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) => (
        ticket.id === id
          ? {
            ...ticket,
            task: '',
            tasks: [...ticketTasks(ticket), { id: crypto.randomUUID(), text: trimmed, done: false }],
          }
          : ticket
      )),
    }))
  }, [update])

  const deleteTicketTask = useCallback((id, taskId) => {
    update((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) => (
        ticket.id === id
          ? {
            ...ticket,
            task: '',
            tasks: ticketTasks(ticket).filter((task) => task.id !== taskId),
          }
          : ticket
      )),
    }))
  }, [update])

  const toggleTicketTask = useCallback((id, taskId) => {
    update((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) => (
        ticket.id === id
          ? {
            ...ticket,
            task: '',
            tasks: ticketTasks(ticket).map((task) => (
              task.id === taskId ? { ...task, done: !task.done } : task
            )),
          }
          : ticket
      )),
    }))
  }, [update])

  const addComment = useCallback((id, { text, author }) => {
    const trimmed = (text || '').trim()
    if (!trimmed) return
    update((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) => (
        ticket.id === id
          ? {
            ...ticket,
            comments: [
              ...(ticket.comments || []),
              {
                id: crypto.randomUUID(),
                text: trimmed,
                author: author || '',
                createdAt: new Date().toISOString(),
              },
            ],
          }
          : ticket
      )),
    }))
  }, [update])

  const deleteComment = useCallback((id, commentId) => {
    update((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) => (
        ticket.id === id
          ? {
            ...ticket,
            comments: (ticket.comments || []).filter((item) => item.id !== commentId),
          }
          : ticket
      )),
    }))
  }, [update])

  const saveImportedWord = useCallback((partialTickets, summary) => {
    const prev = stateRef.current
    if (!prev) return Promise.reject(new Error('El tablero todavía no cargó.'))
    const now = new Date().toISOString()
    const boardId = prev.selectedBoardId
    const created = (partialTickets || []).map((ticket) => ({
      id: crypto.randomUUID(),
      boardId,
      title: ticket.title,
      description: ticket.description || '',
      status: ticket.status || DEFAULT_COLUMN_ID,
      ...assigneeFields(ticket.assignees ?? ticket.assignee),
      followers: Array.isArray(ticket.followers) ? ticket.followers : [],
      priority: ticket.priority || DEFAULT_PRIORITY,
      labels: ticket.labels || [],
      dueDate: ticket.dueDate || '',
      expediente: String(ticket.expediente || '').trim(),
      task: '',
      tasks: [],
      createdAt: now,
      source: 'word',
      importId: '',
      comments: [],
    }))
    const entry = {
      id: summary.id || crypto.randomUUID(),
      fileName: summary.fileName || 'documento.docx',
      boardId: summary.boardId || boardId || '',
      boardName: summary.boardName || '',
      imported: summary.imported || created.length,
      skippedNoTitle: summary.skippedNoTitle || 0,
      author: summary.author || '',
      createdAt: summary.createdAt || now,
    }
    for (const ticket of created) ticket.importId = entry.id
    const next = {
      ...prev,
      tickets: [...(prev.tickets || []), ...created],
      imports: [entry, ...(prev.imports || []).filter((item) => item.id !== entry.id)],
    }
    if (!next.boards?.length) {
      return Promise.reject(new Error('No se pudo guardar en el servidor: falta el tablero.'))
    }
    revision.current += 1
    const revisionAtSave = revision.current
    dirty.current = true
    stateRef.current = next
    setState(next)
    return saveKanbanRequest(packKanban(next)).then((res) => {
      const unpacked = unpackKanban(res.data)
      unpacked.tickets = mergeLocalTicketFields(next.tickets, unpacked.tickets)
      if (revision.current !== revisionAtSave) return { entry, created }
      revision.current += 1
      dirty.current = false
      setSaveError(null)
      setState({
        ...unpacked,
        selectedBoardId: prev.selectedBoardId,
      })
      return { entry, created }
    }).catch((error) => {
      if (!error.response) throw error
      const message = error.response.data?.message
      throw new Error(typeof message === 'string' ? message : 'No se pudo guardar en el servidor.')
    })
  }, [])

  const deleteImport = useCallback((importId) => {
    const prev = stateRef.current
    const item = (prev?.imports || []).find((entry) => entry.id === importId)
    if (!item) return []
    const removed = (prev.tickets || []).filter((ticket) => ticketBelongsToImport(ticket, item)).map((ticket) => ticket.id)
    const removedIds = new Set(removed)
    update((state) => ({
      ...state,
      imports: (state.imports || []).filter((entry) => entry.id !== importId),
      tickets: (state.tickets || []).filter((ticket) => !removedIds.has(ticket.id)),
    }))
    return removed
  }, [update])

  const resetAll = useCallback(() => {
    clearStorage()
    const next = createDefaultState()
    writeSelected(next.selectedBoardId)
    dirty.current = true
    setState(next)
  }, [])

  return {
    ready,
    saveError,
    boards: state?.boards || [],
    tickets,
    selectedBoardId,
    createBoard,
    selectBoard,
    saveBoardFilters,
    createTicket,
    updateTicket,
    moveTicket,
    deleteTicket,
    importTickets,
    addTicketTask,
    toggleTicketTask,
    deleteTicketTask,
    addComment,
    deleteComment,
    saveImportedWord,
    deleteImport,
    allTickets: state?.tickets || [],
    imports: state?.imports || [],
    resetAll,
  }
}

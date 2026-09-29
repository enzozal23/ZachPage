import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadStoredState, createDefaultState, clearStorage, renameLegacyBoards } from '../lib/storage.js'
import { getKanbanRequest, saveKanbanRequest } from '../../api/kanban.js'
import { DEFAULT_COLUMN_ID, DEFAULT_PRIORITY } from '../constants/columns.js'
import { assigneeFields, ticketAssignees } from '../lib/assignees.js'
import { ticketTasks } from '../lib/tasks.js'
import { packKanban, unpackKanban } from '../lib/persist.js'

const SELECTED_KEY = 'tablero-kanban:selectedBoardId'

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

export function useKanbanStore() {
  const [state, setState] = useState(null)
  const [ready, setReady] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const dirty = useRef(false)
  const revision = useRef(0)
  const stateRef = useRef(null)
  stateRef.current = state

  useEffect(() => {
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

    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready || !state || !dirty.current) return
    const revisionAtSave = revision.current
    const snapshot = state
    const handle = setTimeout(() => {
      saveKanbanRequest(packKanban(snapshot))
        .then((res) => {
          if (revision.current !== revisionAtSave) return
          const next = unpackKanban(res.data)
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
      tickets: prev.tickets.map((ticket) => (ticket.id === id ? { ...ticket, ...data } : ticket)),
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
      task: '',
      tasks: [],
      createdAt: now,
      source: 'word',
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
    createTicket,
    updateTicket,
    deleteTicket,
    importTickets,
    addTicketTask,
    toggleTicketTask,
    addComment,
    saveImportedWord,
    imports: state?.imports || [],
    resetAll,
  }
}

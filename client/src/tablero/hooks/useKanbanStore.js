import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadState, saveState, createDefaultState, clearStorage } from '../lib/storage.js'
import { getKanbanRequest, saveKanbanRequest } from '../../api/kanban.js'
import { DEFAULT_COLUMN_ID, DEFAULT_PRIORITY } from '../constants/columns.js'

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

function pickSelected(boards, preferred) {
  if (preferred && boards.some((board) => board.id === preferred)) return preferred
  return boards[0]?.id || null
}

export function useKanbanStore() {
  const [state, setState] = useState(null)
  const [ready, setReady] = useState(false)
  const dirty = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const local = loadState()
      try {
        const res = await getKanbanRequest()
        let remote = res.data
        if (!remote?.boards?.length) {
          const saved = await saveKanbanRequest({
            boards: local.boards,
            tickets: local.tickets,
          })
          remote = saved.data
        }
        if (cancelled) return
        const boards = remote.boards
        const selectedBoardId = pickSelected(boards, readSelected() || local.selectedBoardId)
        writeSelected(selectedBoardId)
        const next = { boards, tickets: remote.tickets || [], selectedBoardId }
        saveState(next)
        setState(next)
      } catch {
        if (!cancelled) setState(local)
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
    saveState(state)
    writeSelected(state.selectedBoardId)
    const handle = setTimeout(() => {
      saveKanbanRequest({ boards: state.boards, tickets: state.tickets }).catch(() => {})
    }, 500)
    return () => clearTimeout(handle)
  }, [state, ready])

  const update = useCallback((recipe) => {
    dirty.current = true
    setState((prev) => recipe(prev))
  }, [])

  const selectedBoardId = state?.selectedBoardId

  const tickets = useMemo(
    () => (state?.tickets || []).filter((ticket) => ticket.boardId === selectedBoardId),
    [state?.tickets, selectedBoardId],
  )

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
        assignee: (data.assignee || '').trim(),
        priority: data.priority || DEFAULT_PRIORITY,
        labels: data.labels || [],
        dueDate: data.dueDate || '',
        task: (data.task || '').trim(),
        createdAt: new Date().toISOString(),
        source: 'manual',
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
    let created = []
    update((prev) => {
      created = partialTickets.map((ticket) => ({
        id: crypto.randomUUID(),
        boardId: prev.selectedBoardId,
        title: ticket.title,
        description: ticket.description || '',
        status: ticket.status || DEFAULT_COLUMN_ID,
        assignee: ticket.assignee || '',
        priority: ticket.priority || DEFAULT_PRIORITY,
        labels: ticket.labels || [],
        dueDate: ticket.dueDate || '',
        task: '',
        createdAt: now,
        source: 'word',
      }))
      return { ...prev, tickets: [...prev.tickets, ...created] }
    })
    return created
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
    boards: state?.boards || [],
    tickets,
    selectedBoardId,
    createBoard,
    selectBoard,
    createTicket,
    updateTicket,
    deleteTicket,
    importTickets,
    resetAll,
  }
}

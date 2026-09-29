import { useCallback, useEffect, useMemo, useState } from 'react'
import { loadState, saveState, createDefaultState, clearStorage } from '../lib/storage.js'
import { DEFAULT_COLUMN_ID, DEFAULT_PRIORITY } from '../constants/columns.js'

export function useKanbanStore() {
  const [state, setState] = useState(loadState)

  useEffect(() => {
    saveState(state)
  }, [state])

  const selectedBoardId = state.selectedBoardId

  const tickets = useMemo(
    () => state.tickets.filter((t) => t.boardId === selectedBoardId),
    [state.tickets, selectedBoardId],
  )

  const createBoard = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const board = {
      id: crypto.randomUUID(),
      name: trimmed,
      createdAt: new Date().toISOString(),
    }
    setState((prev) => ({
      ...prev,
      boards: [...prev.boards, board],
      selectedBoardId: board.id,
    }))
  }, [])

  const selectBoard = useCallback((boardId) => {
    setState((prev) => ({ ...prev, selectedBoardId: boardId }))
  }, [])

  const createTicket = useCallback((data) => {
    setState((prev) => {
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
  }, [])

  const updateTicket = useCallback((id, data) => {
    setState((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.id === id ? { ...t, ...data } : t)),
    }))
  }, [])

  const deleteTicket = useCallback((id) => {
    setState((prev) => ({ ...prev, tickets: prev.tickets.filter((t) => t.id !== id) }))
  }, [])

  const importTickets = useCallback(
    (partialTickets) => {
      const now = new Date().toISOString()
      const newTickets = partialTickets.map((t) => ({
        id: crypto.randomUUID(),
        boardId: selectedBoardId,
        title: t.title,
        description: t.description || '',
        status: t.status || DEFAULT_COLUMN_ID,
        assignee: t.assignee || '',
        priority: t.priority || DEFAULT_PRIORITY,
        labels: t.labels || [],
        dueDate: t.dueDate || '',
        task: '',
        createdAt: now,
        source: 'word',
      }))
      setState((prev) => ({ ...prev, tickets: [...prev.tickets, ...newTickets] }))
      return newTickets
    },
    [selectedBoardId],
  )

  // TODO: botón provisorio de reset, sacar cuando no se necesite más para testing
  const resetAll = useCallback(() => {
    clearStorage()
    setState(createDefaultState())
  }, [])

  return {
    boards: state.boards,
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

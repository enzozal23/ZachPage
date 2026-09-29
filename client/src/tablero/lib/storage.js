const STORAGE_KEY = 'tablero-kanban:data'

export function createDefaultState() {
  const board = {
    id: crypto.randomUUID(),
    name: 'Tablero 1',
    createdAt: new Date().toISOString(),
  }
  return { boards: [board], tickets: [], selectedBoardId: board.id }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultState()

    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.boards) || !Array.isArray(parsed.tickets)) {
      return createDefaultState()
    }

    if (parsed.boards.length === 0) {
      return createDefaultState()
    }

    if (!parsed.selectedBoardId || !parsed.boards.some((b) => b.id === parsed.selectedBoardId)) {
      parsed.selectedBoardId = parsed.boards[0].id
    }

    return parsed
  } catch {
    return createDefaultState()
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

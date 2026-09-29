const STORAGE_KEY = 'tablero-kanban:data'

export function createDefaultState() {
  const board = {
    id: crypto.randomUUID(),
    name: 'Tablero 1',
    createdAt: new Date().toISOString(),
  }
  return { boards: [board], tickets: [], imports: [], selectedBoardId: board.id }
}

export function loadStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.boards) || !Array.isArray(parsed.tickets)) {
      return null
    }

    if (parsed.boards.length === 0) {
      return null
    }

    if (!parsed.selectedBoardId || !parsed.boards.some((b) => b.id === parsed.selectedBoardId)) {
      parsed.selectedBoardId = parsed.boards[0].id
    }

    if (!Array.isArray(parsed.imports)) parsed.imports = []

    return parsed
  } catch {
    return null
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearStorage() {
  localStorage.removeItem(STORAGE_KEY)
}

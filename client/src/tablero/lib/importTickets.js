export function ticketBelongsToImport(ticket, item) {
  if (!ticket || !item?.id) return false
  if (String(ticket.importId || '').trim() === item.id) return true
  if (String(ticket.importId || '').trim()) return false
  if (ticket.source !== 'word') return false
  if (!item.createdAt || ticket.createdAt !== item.createdAt) return false
  if (item.boardId && ticket.boardId && ticket.boardId !== item.boardId) return false
  return true
}

export function ticketsFromImport(tickets, item) {
  return (tickets || []).filter((ticket) => ticketBelongsToImport(ticket, item))
}

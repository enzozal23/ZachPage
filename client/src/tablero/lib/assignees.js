export function ticketAssignees(ticket) {
  if (Array.isArray(ticket?.assignees)) {
    return [...new Set(ticket.assignees.map((name) => String(name || '').trim()).filter(Boolean))]
  }
  return String(ticket?.assignee || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)
}

export function ticketFollowers(ticket) {
  if (!Array.isArray(ticket?.followers)) return []
  return [...new Set(ticket.followers.map((name) => String(name || '').trim()).filter(Boolean))]
}

export function assigneeFields(value) {
  const assignees = ticketAssignees({ assignees: value, assignee: value })
  return {
    assignees,
    assignee: assignees[0] || '',
  }
}

export function ticketTasks(ticket) {
  if (Array.isArray(ticket?.tasks)) {
    return ticket.tasks
      .map((task) => ({
        id: String(task?.id || ''),
        text: String(task?.text || '').trim(),
        done: Boolean(task?.done),
      }))
      .filter((task) => task.id && task.text)
  }
  const legacy = String(ticket?.task || '').trim()
  if (!legacy) return []
  return [{ id: `legacy-${ticket?.id || 'task'}`, text: legacy, done: false }]
}

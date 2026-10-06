import axios from './axios.js'

export const getKanbanRequest = () => axios.get('api/kanban')
export const saveKanbanRequest = (state) => axios.put('api/kanban', state)
export const importKanbanWordRequest = (payload) => axios.post('api/kanban/imports', payload)
export const testDueReminderRequest = (ticketId) => axios.post(`api/kanban/tickets/${ticketId}/test-reminder`)

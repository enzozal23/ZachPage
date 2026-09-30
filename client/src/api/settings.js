import axios from './axios.js'

export const getSettingsRequest = () => axios.get('api/kanban/settings')
export const saveSettingsRequest = (settings) => axios.put('api/kanban/settings', settings)

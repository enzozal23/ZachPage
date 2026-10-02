import axios from './axios.js'

export const getSettingsRequest = () => axios.get('api/kanban/settings')
export const saveSettingsRequest = (settings) => axios.put('api/kanban/settings', settings)
export const downloadBackupRequest = () => axios.get('api/backup', { responseType: 'blob' })
export const importBackupRequest = (backup) => axios.post('api/backup', backup)

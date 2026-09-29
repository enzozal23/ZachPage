import axios from './axios.js'

export const getLogsRequest = (level) => axios.get('api/logs', { params: level ? { level } : {} })

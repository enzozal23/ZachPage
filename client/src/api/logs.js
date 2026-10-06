import axios from './axios.js'

export const getLogsRequest = (level) => axios.get('api/logs', { params: level ? { level } : {} })
export const getMailLogsRequest = () => axios.get('api/logs/mail')
export const getSessionLogsRequest = () => axios.get('api/logs/session')
export const getHostRequest = () => axios.get('api/logs/host')

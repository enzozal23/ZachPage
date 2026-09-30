import axios from './axios.js'

export const getActivityRequest = (params = {}) => axios.get('api/activity', { params })

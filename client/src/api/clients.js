import axios from './axios.js'

export const listClientsRequest = () => axios.get('api/clients')
export const createClientRequest = (client) => axios.post('api/clients', client)
export const updateClientRequest = (id, client) => axios.put(`api/clients/${id}`, client)
export const deleteClientRequest = (id) => axios.delete(`api/clients/${id}`)
export const importClientsRequest = (clients) => axios.post('api/clients/import', { clients })

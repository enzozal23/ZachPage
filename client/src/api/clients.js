import axios from './axios.js'

export const listClientsRequest = () => axios.get('api/clients')
export const createClientRequest = (client) => axios.post('api/clients', client)
export const updateClientRequest = (id, client) => axios.put(`api/clients/${id}`, client)
export const deleteClientRequest = (id) => axios.delete(`api/clients/${id}`)
export const importClientsRequest = (clients) => axios.post('api/clients/import', { clients })
export const listClientFieldsRequest = () => axios.get('api/clients/fields')
export const migrateClientFieldsRequest = () => axios.post('api/clients/fields/migrate')
export const logClientsExportRequest = (count) => axios.post('api/clients/export', { count })
export const createClientFieldRequest = (field) => axios.post('api/clients/fields', field)
export const updateClientFieldRequest = (id, field) => axios.put(`api/clients/fields/${id}`, field)
export const deleteClientFieldRequest = (id) => axios.delete(`api/clients/fields/${id}`)

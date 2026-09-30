import axios from './axios'

export const registerRequest = (user) => axios.post('api/register', user)
export const loginRequest = (user) => axios.post('api/login', user)
export const logoutRequest = () => axios.post('api/logout')
export const verifyTokenRequest = () => axios.get('api/verify')
export const getUsersRequest = (q = '') => axios.get('api/users', { params: q ? { q } : {} })
export const listAllUsersRequest = () => axios.get('api/users/all')
export const createUserRequest = (user) => axios.post('api/users', user)
export const updateUserRequest = (id, user) => axios.put(`api/users/${id}`, user)
export const deleteUserRequest = (id) => axios.delete(`api/users/${id}`)

let userSearchCache = null

export function clearUserSearchCache() {
    userSearchCache = null
}

function matchesUser(user, query) {
    return `${user.username || ''} ${user.email || ''}`.toLowerCase().includes(query)
}

export async function searchUsers(q) {
    const query = String(q || '').trim().toLowerCase()
    if (query.length < 2) return []
    if (!userSearchCache) {
        const res = await getUsersRequest(query)
        const list = Array.isArray(res.data) ? res.data : []
        if (list.length > 8) userSearchCache = list
        else return list.filter((user) => matchesUser(user, query)).slice(0, 8)
    }
    return userSearchCache.filter((user) => matchesUser(user, query)).slice(0, 8)
}

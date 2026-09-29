import axios from 'axios'

// 

const TOKEN_KEY = 'token'

const instance = axios.create({
    baseURL: import.meta.env.DEV ? '/' : 'https://zachpage.onrender.com/',
    withCredentials: true
})

instance.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

export default instance
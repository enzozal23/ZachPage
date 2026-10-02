import axios from 'axios'

const instance = axios.create({
    baseURL: import.meta.env.DEV ? '/' : 'https://zachpage.onrender.com/',
    withCredentials: true,
})

instance.interceptors.request.use((config) => {
    config.headers['X-Lexora-Request'] = '1'
    return config
})

export default instance
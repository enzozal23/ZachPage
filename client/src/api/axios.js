import axios from 'axios'



const instance = axios.create({
    baseURL: 'https://zachpage-frontend.onrender.com',
    withCredentials: true
})
export default instance
import axios from 'axios'



const instance = axios.create({
    baseURL: 'https://zachpage.onrender.com/api',
    withCredentials: true
})
export default instance
import axios from './axios';
const API = 'https://zachpage.onrender.com/api'

export const registerRequest = user => axios.post(`/register`, user)
export const loginRequest = user => axios.post(`/login`, user)
export const verifyTokenRequest = () => axios.get(`/verify`)

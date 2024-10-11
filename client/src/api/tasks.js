import axios from "./axios";



export const getTasksRequest = () => axios.get('api/tasks')
export const getTaskRequest = (id) => axios.get(`api/tasks/${id}`)
export const createTasksRequest = (task) => axios.post('api/tasks', task)
export const updateTasksRequest = (task) => axios.put(`api/tasks/${task.id}`, task)
export const deleteTasksRequest = (id) => axios.delete(`api/tasks/${id}`)

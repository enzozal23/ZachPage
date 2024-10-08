import { Router } from "express";
import { getTasks, getTask, createTasks, updateTask, deleteTask } from '../controllers/tasks.controller.js'
import { authRequired } from "../middlewares/validateToken.js"
import { validateSchema } from "../middlewares/validator.middleware.js";
import { createTaskSchema } from "../schemas/task.schema.js";



const router = Router()
router.get('/tasks', authRequired, getTasks)
router.get('/tasks/:id', authRequired, getTask)
router.post('/tasks', authRequired, validateSchema(createTaskSchema), createTasks)
router.put('/tasks/:id', authRequired, updateTask)
router.delete('/tasks/:id', authRequired, deleteTask)


export default router;
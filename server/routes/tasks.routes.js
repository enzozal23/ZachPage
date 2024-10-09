import { Router } from "express";
import { getTasks, getTask, createTasks, updateTask, deleteTask } from '../controllers/tasks.controller.js'
import { authRequired } from "../middlewares/validateToken.js"
import { validateSchema } from "../middlewares/validator.middleware.js";
import { createTaskSchema } from "../schemas/task.schema.js";



const router = Router()
router.get('api/tasks', authRequired, getTasks)
router.get('api/tasks/:id', authRequired, getTask)
router.post('api/tasks', authRequired, validateSchema(createTaskSchema), createTasks)
router.put('api/tasks/:id', authRequired, updateTask)
router.delete('api/tasks/:id', authRequired, deleteTask)


export default router;
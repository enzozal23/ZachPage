import express from 'express'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'
import tasksRoutes from './routes/tasks.routes.js'
import productsRoutes from './routes/products.routes.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
//inicializando app
const app = express()


dotenv.config()
//middlewares
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}))
app.use(morgan('dev'))//ver las peticiones
app.use(express.json())//consola pueda leer json del body
app.use(cookieParser())//
app.use('/api', authRoutes)//rutas api
app.use('/api', tasksRoutes)
app.use('/api', productsRoutes)



export default app
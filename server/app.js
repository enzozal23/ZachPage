import express from 'express'
import morgan from 'morgan'
import authRoutes from './routes/auth.routes.js'
import tasksRoutes from './routes/tasks.routes.js'
import productsRoutes from './routes/products.routes.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url'
//inicializando app
const app = express()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

app.use(express.static(path.join(__dirname, 'public', 'build')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'build', 'index.html'));
});
export default app
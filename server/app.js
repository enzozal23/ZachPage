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
const allowedOrigins = [
    'https://zachpage-frontend.onrender.com',
    'https://zachstore.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // Si el origen está en la lista de permitidos o si no hay origen (por ejemplo, en solicitudes como postman), lo permitimos
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true
}));
app.use(morgan('dev'))//ver las peticiones
app.use(express.json())//consola pueda leer json del body
app.use(cookieParser())//
app.use('/api', authRoutes)//rutas api
app.use('/api', tasksRoutes)
app.use('/api', productsRoutes)


export default app
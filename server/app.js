import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import authRoutes from './routes/auth.routes.js'
import kanbanRoutes from './routes/kanban.routes.js'
import logsRoutes from './routes/logs.routes.js'
import activityRoutes from './routes/activity.routes.js'
import clientsRoutes from './routes/clients.routes.js'
import permisosRoutes from './routes/permisos.routes.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url'
import { appRequestRequired } from './middlewares/appRequest.js'
//inicializando app
const app = express()

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config()
//middlewares
const allowedOrigins = [
    'https://zachpage-frontend.onrender.com',
    'https://lexora-board.onrender.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
];

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Lexora-Request'],
}));
app.use(morgan('dev'))//ver las peticiones
app.set('trust proxy', 1)
app.use(express.json({ limit: '2mb' }))
app.use(cookieParser())//
app.use('/api', appRequestRequired)
app.use('/api', authRoutes)//rutas api
app.use('/api', kanbanRoutes)
app.use('/api', logsRoutes)
app.use('/api', activityRoutes)
app.use('/api', clientsRoutes)
app.use('/api', permisosRoutes)

app.get('/', (_req, res) => {
    res.redirect('https://zachpage-frontend.onrender.com/')
})


export default app
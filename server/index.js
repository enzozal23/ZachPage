import app from './app.js'
import { connectDB } from './db.js'
import { startDueReminders } from './kanbanReminders.js'
import dotenv from 'dotenv';
dotenv.config()
connectDB()
startDueReminders()
app.listen(process.env.PORT || 8080)
console.log('server on port ', 8080)
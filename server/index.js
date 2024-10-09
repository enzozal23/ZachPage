import app from './app.js'
import { connectDB } from './db.js'
import dotenv from 'dotenv';
dotenv.config()
connectDB()
app.listen(process.env.PORT || 3000)
console.log('server on port ', 3000)
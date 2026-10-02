import mongoose from "mongoose"
import dotenv from 'dotenv'
import User from './models/user.models.js'
dotenv.config()
const uri = process.env.DB_TOKEN
export const connectDB = async () => {
    try {


        mongoose.set('strictPopulate', false);


        await mongoose.connect(uri)
        await User.updateMany({ role: { $nin: ['admin', 'user'] } }, { $set: { role: 'admin' } })


        console.log('mongo conectado')
    } catch (error) {
        console.log('No se pudo conectar mongo' + error)
    }
}





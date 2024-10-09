import mongoose from "mongoose"
import dotenv from 'dotenv'
dotenv.config()
const uri = process.env.DB_TOKEN
export const connectDB = async () => {
    try {


        mongoose.set('strictPopulate', false);


        await mongoose.connect(uri)


        console.log('mongo conectado')
    } catch (error) {
        console.log('No se pudo conectar mongo' + error)
    }
}





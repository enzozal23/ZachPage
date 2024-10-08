import mongoose from "mongoose"

export const connectDB = async () => {
    try {


        mongoose.set('strictPopulate', false);


        await mongoose.connect('mongodb+srv://enzo-coderback:cSU3re9634dzg1tb@cluster0.f9fcrmm.mongodb.net/tarjetaDigital')


        console.log('mongo conectado')
    } catch (error) {
        console.log('No se pudo conectar mongo' + error)
    }
}





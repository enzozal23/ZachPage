import { Schema, model } from "mongoose";



const userSchema = new Schema({
    username: {
        type: String
    },
    email: {
        type: String,
        require: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        require: true,
    }
}, {
    timestamps: true,
})


export default model('User', userSchema)
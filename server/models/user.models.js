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
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    },
    tokenVersion: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
})


export default model('User', userSchema)
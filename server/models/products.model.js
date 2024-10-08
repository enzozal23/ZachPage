import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    code: {
        type: Number,
        required: true,
        trim: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    category: {
        type: String,
        enum: ['creatinas', 'proteinas', 'preentrenos', 'colageno'],
        required: true
    },
    image: {
        type: String,
        default: 'default.jpg'
    }

}, { timestamps: true });

export default mongoose.model("Product", productSchema);
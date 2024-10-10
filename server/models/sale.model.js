import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
    customer: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    seller: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['efectivo', 'credito', 'debito', 'transferencia', 'otro'] // puedes agregar otros métodos
    },
    product: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: 'default.jpg'
    },
    cantidad: {
        type: Number,
        required: true,
        min: 1
    },
    dateCreate: {
        type: Date,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Sale = mongoose.model('Sale', saleSchema);

export default Sale;
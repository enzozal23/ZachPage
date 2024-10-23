import mongoose from 'mongoose';


const saleSchema = new mongoose.Schema({
    email: { type: String, required: true },
    products: [{
        title: { type: String, required: true },
        code: { type: Number, required: true },
        quantityToSell: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    seller: { type: String },
    telfone: { type: Number },
    Idventa: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const SaleWeb = mongoose.model('SaleWeb', saleSchema);

export default SaleWeb;

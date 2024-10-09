import { Router } from 'express';
import { createProduct, getProducts, getAllSales, getProductByCode, getProduct, updateProduct, updateProductByCode, deleteProduct, sellProducts, createSale } from '../controllers/products.controllers.js';

const router = Router();

router.post('/products', createProduct);
router.post('/products/sales', createSale)
router.get('/products/sales', getAllSales);
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.get('/products/code/:code', getProductByCode);
router.put('/products/:id', updateProduct,);
router.put('/products/code/:code', updateProductByCode);
router.put('/products/sell/:code', sellProducts)
router.delete('/products/:id', deleteProduct);

export default router;

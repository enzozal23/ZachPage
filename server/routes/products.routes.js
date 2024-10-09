import { Router } from 'express';
import { createProduct, getProducts, getAllSales, getProductByCode, getProduct, updateProduct, updateProductByCode, deleteProduct, sellProducts, createSale } from '../controllers/products.controllers.js';

const router = Router();

router.post('api/products', createProduct);
router.post('api/products/sales', createSale)
router.get('api/products/sales', getAllSales);
router.get('api/products', getProducts);
router.get('api/products/:id', getProduct);
router.get('api/products/code/:code', getProductByCode);
router.put('api/products/:id', updateProduct,);
router.put('api/products/code/:code', updateProductByCode);
router.put('api/products/sell/:code', sellProducts)
router.delete('api/products/:id', deleteProduct);

export default router;

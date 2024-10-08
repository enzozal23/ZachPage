import axios from "./axios";



export const getProductsRequest = () => axios.get('/products')
export const getProductRequest = (id) => axios.get(`/products/${id}`)
export const getByCodeProductRequest = (code) => axios.get(`/products/code/${code}`)
export const getAllSalesRequest = () => axios.get(`/products/sales`)
export const createProductsRequest = (product) => axios.post('/products', product)
export const createSaleRequest = (sale) => axios.post('/products/sales', sale)
export const updateProductRequest = (product) => axios.put(`/products/${product.id}`, product)
export const sellProductRequest = (code, quantityToSell) => axios.put(`/products/sell/${code}`, { quantityToSell })
export const deleteProductRequest = (id) => axios.delete(`/products/${id}`)
export const upByCodeProductRequest = (code, product) => axios.put(`/products/code/${code}`, product)
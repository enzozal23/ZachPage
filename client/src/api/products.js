import axios from "./axios";



export const getProductsRequest = () => axios.get('api/products')
export const getProductRequest = (id) => axios.get(`api/products/${id}`)
export const getByCodeProductRequest = (code) => axios.get(`api/products/code/${code}`)
export const getAllSalesRequest = () => axios.get(`api/products/sales`)
export const getAllSalewebsRequest = () => axios.get('api/products/salesWeb')
export const createProductsRequest = (product) => axios.post('api/products', product)
export const createSaleRequest = (sale) => axios.post('api/products/sales', sale)
export const updateProductRequest = (product) => axios.put(`api/products/${product.id}`, product)
export const sellProductRequest = (code, quantityToSell) => axios.put(`api/products/sell/${code}`, { quantityToSell })
export const deleteProductRequest = (id) => axios.delete(`api/products/${id}`)
export const upByCodeProductRequest = (code, product) => axios.put(`api/products/code/${code}`, product)

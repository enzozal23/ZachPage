import { createContext, useContext, useState } from "react";
import { getProductsRequest } from "../api/products";
const ProductsContext = createContext();
export const useProducts = () => {
    const context = useContext(ProductsContext);
    if (!context) {
        throw new Error("useTasks must be used within a productProvider" + 'line 7 ProductsContext.jsx')
    }
    return context;

}
export function ProductsProvider({ children }) {
    const [products, setProducts] = useState([])

    const getProducts = async () => {
        try {
            const res = await getProductsRequest()
            setProducts(res.data)
        } catch (error) {
            console.log(error)
        }
    }

    const createProducts = async (products) => {
        const res = await createTasksRequest(products)
        console.log(res)
    }
    return (
        <ProductsContext.Provider value={{ products, getProducts }}>
            {children}
        </ProductsContext.Provider>
    )
}
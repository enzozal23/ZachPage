import { useProducts } from "../context/ProductsContext";
import { useEffect, useState } from "react";

function CardsProducts() {
    const { getProducts, products } = useProducts();
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [category, setCategory] = useState("");
    const [brand, setBrand] = useState("");
    const [loading, setLoading] = useState(true); // Estado para manejar el loading

    useEffect(() => {
        const fetchProducts = async () => {
            await getProducts(); // Llama a la función para obtener los productos
            setLoading(false); // Después de cargar los productos, quitamos el loading
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, category, brand]);

    // Función para filtrar los productos según la categoría y la marca seleccionadas
    const filterProducts = () => {
        let filtered = products;

        if (category) {
            filtered = filtered.filter(product => product.category === category);
        }

        if (brand) {
            filtered = filtered.filter(product => product.marca === brand);
        }

        setFilteredProducts(filtered);
    };

    return (
        <div className="bg-white">
            {loading ? (
                // Spinner que se muestra mientras se cargan los productos
                <div className="flex items-center justify-center h-screen">
                    <div className="spinner"><svg className="animate-spin h-20 w-20 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg></div>
                </div>
            ) : (
                <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
                    <h2 className="text-5xl font-bold mb-6 text-blue-400">Productos</h2>

                    {/* Filtros */}
                    <div className="mb-6">
                        <label className="mr-4 font-semibold text-black">Filtrar por categoría:</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 mr-4 text-blue-500"
                        >
                            <option value="">Todas las categorías</option>
                            <option value="creatinas">Creatinas</option>
                            <option value="proteinas">Proteínas</option>
                            <option value="preentrenos">Pre entreno</option>
                            <option value="aminoacidos">Aminoácidos</option>
                            <option value="vitaminas">Vitaminas</option>
                            <option value="colageno">Colageno</option>
                        </select>

                        <label className="mr-4 font-semibold text-black">Filtrar por marca:</label>
                        <select
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className="border border-gray-300 rounded-md p-2 text-blue-500"
                        >
                            <option value="">Todas las marcas</option>
                            <option value="Star">Star</option>
                            <option value="Fynutrition">Fynutrition</option>
                            <option value="Gold">Gold</option>
                            <option value="Ena">Ena</option>
                            <option value="Age">Age</option>
                            <option value="HochSport">HochSport</option>
                        </select>
                    </div>

                    {/* Productos filtrados */}
                    <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-6">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((product) => (
                                <a
                                    key={product._id}
                                    href={product.href}
                                    className={`group block ${product.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="aspect-w-1 aspect-h-1 w-full h-48 overflow-hidden rounded-lg bg-gray-200 xl:h-64">
                                        <img
                                            alt={product.imageAlt}
                                            src={product.image}
                                            className="h-full w-full object-cover hover:object-contain object-center group-hover:opacity-75"
                                        />
                                    </div>
                                    <h3 className="mt-4 text-sm text-gray-700">{product.title}</h3>
                                    <p className="text-sm text-gray-500">Cantidad: {product.quantity}</p>
                                    <p className="text-sm text-gray-800">Código: {product.code}</p>
                                    <p className="mt-1 text-lg font-medium text-gray-900">${product.price}</p>
                                </a>
                            ))
                        ) : (
                            <p className="text-gray-500">No se encontraron productos</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default CardsProducts;

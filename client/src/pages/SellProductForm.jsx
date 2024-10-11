import { useForm } from 'react-hook-form';
import { getByCodeProductRequest, sellProductRequest, createSaleRequest } from '../api/products';
import { useState, useEffect } from 'react';

function SellProductForm() {
    const { register, handleSubmit, getValues, setValue, watch, reset, formState: { errors } } = useForm();
    const [existProduct, setExistProduct] = useState(false);

    const code = watch('code');

    useEffect(() => {
        if (code) {
            handleSearch(code);
        } else {
            resetFormFields();
        }
    }, [code]);

    const handleSearch = async (code) => {
        if (!code) return;

        try {
            const response = await getByCodeProductRequest(code);
            if (response && response.data) {
                setExistProduct(true);
                setValue('title', response.data.title);
                setValue('description', response.data.description);
                setValue('price', response.data.price);
                setValue('quantity', response.data.quantity);
                setValue('category', response.data.category);
                setValue('image', response.data.image);
            } else {
                setExistProduct(false);
                resetFormFields();
            }
        } catch (error) {
            console.error("Error al buscar el producto:", error);
            setExistProduct(false);
            resetFormFields();
        }
    };

    const resetFormFields = () => {
        reset({
            title: '',
            description: '',
            price: '',
            quantity: '',
            category: '',
            image: '',
            sellQuantity: '',
            customer: '', // Campo para el cliente
            paymentMethod: '' // Campo para el método de pago
        });
    };

    const handleSell = async (values) => {
        const { code, sellQuantity, customer, paymentMethod } = values;

        const currentQuantity = getValues('quantity');
        const quantityToSell = Number(sellQuantity);

        if (quantityToSell > currentQuantity) {
            alert("No puedes vender más de la cantidad disponible");
            return;
        }

        try {
            // Vender el producto
            const response = await sellProductRequest(code, quantityToSell);
            console.log("Producto vendido", response.data);
            console.log(response.data);
            // Crear la venta
            const saleData = {
                customer,
                price: response.data.product.price, // Precio del producto
                seller: getValues('seller'), // Asegúrate de obtener el nombre del vendedor
                paymentMethod,
                product: response.data.product.title, // ID del producto vendido
                image: response.data.product.image,
                cantidad: getValues('sellQuantity'),
                dateCreate: response.data.product.createdAt
            };

            const saleResponse = await createSaleRequest(saleData);
            console.log("Venta registrada", saleResponse.data);

            // Actualiza la cantidad restante después de la venta
            setValue('quantity', currentQuantity - quantityToSell);
            reset();
        } catch (error) {
            console.error("Error al procesar la venta:", error);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-100 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">Vender Producto</h2>

            <form onSubmit={handleSubmit(handleSell)} className="space-y-4">
                {/* Campo para el código del producto */}
                <div className="flex items-center">
                    <input type="number"
                        {...register('code', { required: true, valueAsNumber: true, min: 1 })}
                        placeholder="Product Code"
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                    />
                    {errors.code && <p className="text-red-500 text-sm mt-1">El código del producto es obligatorio</p>}
                </div>

                {/* Mostrar imagen solo si el producto existe */}
                <div>
                    {existProduct ? (
                        <div>
                            <img src={getValues('image')} alt="Producto" className="w-32 h-32 object-cover" />
                        </div>
                    ) : (
                        <span className="text-gray-800">No existe el producto</span>
                    )}
                </div>

                {/* Mostrar la cantidad disponible solo si el producto existe */}
                {existProduct && (
                    <div>
                        <label className="block text-gray-700">Cantidad disponible:</label>
                        <input
                            {...register('quantity')}
                            disabled // Solo mostrar la cantidad actual
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-200"
                        />
                    </div>
                )}

                {/* Campo para la cantidad a vender */}
                <div>
                    <input
                        type="number"
                        {...register('sellQuantity', { required: true, valueAsNumber: true, min: 1 })}
                        placeholder="Cantidad a vender"
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                    />
                    {errors.sellQuantity && <p className="text-red-500 text-sm mt-1">La cantidad a vender es obligatoria</p>}
                </div>

                {/* Campo para el cliente */}
                <div>
                    <input
                        {...register('customer', { required: true })}
                        placeholder="Nombre del Cliente"
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                    />
                    {errors.customer && <p className="text-red-500 text-sm mt-1">El nombre del cliente es obligatorio</p>}
                </div>
                <div>

                    <select
                        {...register('seller', { required: true })} // Usamos el register de react-hook-form para el select
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                    >
                        <option value="">Seleccionar vendedor</option> {/* Opción por defecto */}
                        <option value="Ricardo">Ricardo</option>
                        <option value="Enzo">Enzo</option>
                    </select>
                    {errors.seller && <p className="text-red-500 text-sm mt-1">El nombre del vendedor es obligatorio</p>}
                </div>

                {/* Campo para el método de pago */}
                <div>
                    <select {...register('paymentMethod', { required: true })} className="w-full p-2 border border-gray-300 rounded-md text-gray-800">
                        <option value="">Método de Pago</option>
                        <option value="efectivo">efectivo</option>
                        <option value="transferencia">transferencia</option>
                        <option value="otro">otro</option>
                    </select>
                    {errors.paymentMethod && <p className="text-red-500 text-sm mt-1">El método de pago es obligatorio</p>}
                </div>

                {/* Botón para vender el producto */}
                <button
                    type="submit"
                    className="w-full p-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
                >
                    Vender Producto
                </button>
            </form>
        </div>
    );
}

export default SellProductForm;

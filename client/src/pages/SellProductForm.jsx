import { useForm } from 'react-hook-form';
import { getByCodeProductRequest, sellProductRequest, createSaleRequest } from '../api/products';
import { useState, useEffect } from 'react';

function SellProductForm() {
    const { register, handleSubmit, getValues, setValue, watch, reset, formState: { errors } } = useForm();
    const [existProduct, setExistProduct] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado para controlar el envío

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
            customer: '',
            paymentMethod: ''
        });
    };

    const handleSell = async (values) => {
        setIsSubmitting(true); // Comenzar el loading
        const { code, sellQuantity, customer, paymentMethod } = values;

        const currentQuantity = getValues('quantity');
        const quantityToSell = Number(sellQuantity);

        if (quantityToSell > currentQuantity) {
            alert("No puedes vender más de la cantidad disponible");
            setIsSubmitting(false); // Detener el loading si hay error
            return;
        }

        try {
            // Vender el producto
            const response = await sellProductRequest(code, quantityToSell);
            console.log("Producto vendido", response.data);

            // Crear la venta
            const saleData = {
                customer,
                price: getValues('price') || response.data.product.price,
                seller: getValues('seller'),
                paymentMethod,
                product: response.data.product.title,
                image: response.data.product.image,
                cantidad: getValues('sellQuantity'),
                dateCreate: response.data.product.createdAt
            };

            const saleResponse = await createSaleRequest(saleData);
            console.log("Venta registrada", saleResponse.data);

            setValue('quantity', currentQuantity - quantityToSell);
            reset();
        } catch (error) {
            console.error("Error al procesar la venta:", error);
        } finally {
            setIsSubmitting(false); // Finalizar el loading una vez se haya procesado la venta
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-100 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-center mb-4 text-gray-900">Vender Producto</h2>

            <form onSubmit={handleSubmit(handleSell)} className="space-y-4">
                <div className="flex items-center">
                    <input type="number"
                        {...register('code', { required: true, valueAsNumber: true, min: 1 })}
                        placeholder="Product Code"
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                        disabled={isSubmitting} // Deshabilitar si está en proceso
                    />
                    {errors.code && <p className="text-red-500 text-sm mt-1">El código del producto es obligatorio</p>}
                </div>

                <div>
                    {existProduct ? (
                        <div>
                            <img src={getValues('image')} alt="Producto" className="w-32 h-32 object-cover" />
                        </div>
                    ) : (
                        <span className="text-gray-800">No existe el producto</span>
                    )}
                </div>

                {existProduct && (
                    <div>
                        <label className="block text-gray-700">Cantidad disponible:</label>
                        <input
                            {...register('quantity')}
                            disabled
                            className="w-full p-2 border border-gray-300 rounded-md bg-gray-200"
                        />
                    </div>
                )}

                <div>
                    <input
                        type="number"
                        {...register('sellQuantity', { required: true, valueAsNumber: true, min: 1 })}
                        placeholder="Cantidad a vender"
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                        disabled={isSubmitting} // Deshabilitar si está en proceso
                    />
                    {errors.sellQuantity && <p className="text-red-500 text-sm mt-1">La cantidad a vender es obligatoria</p>}
                </div>

                <div>
                    <input
                        {...register('customer', { required: true })}
                        placeholder="Nombre del Cliente"
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                        disabled={isSubmitting} // Deshabilitar si está en proceso
                    />
                    {errors.customer && <p className="text-red-500 text-sm mt-1">El nombre del cliente es obligatorio</p>}
                </div>

                <div>
                    <select
                        {...register('seller', { required: true })}
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                        disabled={isSubmitting} // Deshabilitar si está en proceso
                    >
                        <option value="">Seleccionar vendedor</option>
                        <option value="Ricardo">Ricardo</option>
                        <option value="Enzo">Enzo</option>
                    </select>
                    {errors.seller && <p className="text-red-500 text-sm mt-1">El nombre del vendedor es obligatorio</p>}
                </div>
                <div>
                    <input
                        type="text"
                        {...register('price', { required: true })}
                        placeholder="price no agregar signo peso"
                        className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                        disabled={isSubmitting}
                        list="price" // Vincula el input al datalist
                    />
                    <datalist id="price">

                        <option value={getValues('price') - getValues('price') * 0.10}>-10%</option>
                        <option value={getValues('price') - getValues('price') * 0.15}>-15%</option>
                        <option value={getValues('price') - getValues('price') * 0.20}>-20%</option>
                    </datalist>
                    {errors.price && <p className="text-red-500 text-sm mt-1">El Monto es obligatorio</p>}
                </div>

                <div>
                    <select {...register('paymentMethod', { required: true })} className="w-full p-2 border border-gray-300 rounded-md text-gray-800" disabled={isSubmitting}>
                        <option value="">Método de Pago</option>
                        <option value="efectivo">efectivo</option>
                        <option value="transferencia">transferencia</option>
                        <option value="otro">otro</option>
                    </select>
                    {errors.paymentMethod && <p className="text-red-500 text-sm mt-1">El método de pago es obligatorio</p>}
                </div>

                <button
                    type="submit"
                    className="w-full flex items-center justify-center p-2 rounded-md bg-green-600 hover:bg-green-700 text-white"
                    disabled={isSubmitting} // Deshabilitar el botón cuando esté en proceso
                >
                    {isSubmitting ? (<svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>) : 'Vender Producto'}
                </button>
            </form>
        </div>
    );
}

export default SellProductForm;

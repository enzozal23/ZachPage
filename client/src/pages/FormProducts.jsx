import { useForm } from 'react-hook-form';
import { createProductsRequest, getByCodeProductRequest, upByCodeProductRequest } from '../api/products';
import { useEffect, useState } from 'react';



function FormProducts() { // isUpdate determina si es actualización
    const { register, handleSubmit, getValues, setValue, reset, watch, formState: { errors } } = useForm();
    const [isUpdate, setIsUpdate] = useState(false)
    const [existProduct, setExistProduct] = useState(false)
    // Función para actualizar un producto

    // Escuchar cambios en el campo 'code'
    const code = watch('code');

    useEffect(() => {
        if (code) {
            handleSearch(code); // Ejecuta búsqueda cuando cambia el código
        } else {
            resetFormFields(); // Resetea el formulario si el código está vacío
        }
    }, [code]);

    const handleSearch = async (code) => {
        if (!code) return; // Asegúrate de que el código no esté vacío

        try {
            const response = await getByCodeProductRequest(code);
            if (response && response.data) {
                setExistProduct(true); // Si el producto existe, muestra la imagen y llena los campos
                setValue('title', response.data.title);
                setValue('marca', response.data.marca);
                setValue('description', response.data.description);
                setValue('price', response.data.price);
                setValue('quantity', response.data.quantity);
                setValue('category', response.data.category);
                setValue('image', response.data.image);
            } else {
                setExistProduct(false); // Si no existe, limpia los campos
                resetFormFields();
            }
        } catch (error) {
            console.error("Error al buscar el producto:", error);
            setExistProduct(false); // Si ocurre un error, también limpiamos
            resetFormFields();
        }
    };

    const resetFormFields = () => {
        // Limpia todos los campos del formulario
        reset({
            title: '',
            marca: '',
            description: '',
            price: '',
            quantity: '',
            category: '',
            image: ''
        });
    };

    const handleUpdate = async (values) => {
        console.log(values)
        try {
            const response = await upByCodeProductRequest(values.code, values);
            console.log("Producto actualizado", response.data);
            reset()
        } catch (error) {
            console.error("Error al actualizar el producto", error);
        }
    };

    // Función para crear un producto
    const handleCreate = async (values) => {
        console.log(values)
        try {
            const response = await createProductsRequest(values);
            console.log("Producto creado", response.data);
            reset()
        } catch (error) {
            console.error("Error al crear el producto", error);
            alert("el producto ya existe")
            reset()
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-100 p-6 rounded-lg shadow-md">
            {/* Toggle entre creación y actualización */}
            <button
                onClick={() => setIsUpdate(!isUpdate)} // Cambia el estado de isUpdate al hacer clic
                className="mb-4 bg-gray-600 text-white p-2 rounded-md hover:bg-gray-700 transition duration-200"
            >
                {isUpdate ? 'Crear Producto' : 'Actualizar Producto'}
            </button>

            <form onSubmit={handleSubmit(isUpdate ? handleUpdate : handleCreate)} className="space-y-4 max-w-md mx-auto bg-gray-100 p-6 rounded-lg shadow-md">

                {/* Campo para el código del producto */}
                <div className='flex items-center'>
                    <input type='number'
                        {...register('code', { required: true })} // El código es siempre obligatorio
                        placeholder='Product Code'
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring focus:ring-blue-200 focus:outline-none"
                    />
                    <button type='button' onClick={() => handleSearch(getValues('code'))} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="26"
                            fill="black"
                            className="bi bi-search"
                            viewBox="0 0 16 16"
                        >
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001q.044.06.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1 1 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0" />
                        </svg>
                    </button>
                    {errors.code && <p className="text-red-500 text-sm mt-1">El código del producto es obligatorio</p>}
                </div>


                <div>
                    {existProduct ? (
                        <div>
                            <img src={getValues('image')} alt="" />
                        </div>
                    ) : (
                        <span className='text-gray-800'>No existe el producto</span>
                    )}
                </div>
                {/* Campo para el título (obligatorio solo al crear) */}
                <div>
                    <input
                        {...register('title', { required: !isUpdate })} // Requerido solo si no es actualización
                        placeholder='Title'
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring focus:ring-blue-200 focus:outline-none"
                    />
                    {errors.title && <p className="text-red-500 text-sm mt-1">El título es obligatorio</p>}
                </div>

                <div>
                    <input
                        {...register('marca', { required: !isUpdate })} //
                        placeholder='marca'
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring focus:ring-blue-200 focus:outline-none"
                    />
                    {errors.marca && <p className="text-red-500 text-sm mt-1">la marca es obligatoria</p>}
                </div>

                <div>
                    <input
                        {...register('description', { required: !isUpdate })} // Requerido solo si no es actualización
                        placeholder='Description'
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring focus:ring-blue-200 focus:outline-none"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">La descripción es obligatoria</p>}
                </div>

                {/* Campo para el precio (obligatorio solo al crear) */}
                <div>
                    <input
                        type="number"
                        {...register('price', { required: !isUpdate })} // Requerido solo si no es actualización
                        placeholder='Price'
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring focus:ring-blue-200 focus:outline-none"
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">El precio es obligatorio</p>}
                </div>

                {/* Campo para la cantidad (obligatorio solo al crear) */}
                <div>
                    <input
                        type="number"
                        {...register('quantity', { required: !isUpdate })} // Requerido solo si no es actualización
                        placeholder='Quantity'
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring focus:ring-blue-200 focus:outline-none"
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">La cantidad es obligatoria</p>}
                </div>

                {/* Campo para la categoría (obligatorio solo al crear) */}
                <div>
                    <input
                        {...register('category', { required: !isUpdate })} // Requerido solo si no es actualización
                        placeholder='Category'
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring focus:ring-blue-200 focus:outline-none"
                    />
                    {errors.category && <p className="text-red-500 text-sm mt-1">La categoría es obligatoria</p>}
                </div>

                {/* Campo para la URL de la imagen (obligatorio solo al crear) */}
                <div>
                    <input
                        type="url"
                        {...register('image', { required: !isUpdate })} // Requerido solo si no es actualización
                        placeholder='Image URL'
                        className="w-full p-2 border border-gray-300 rounded-md bg-white text-gray-800 focus:ring focus:ring-blue-200 focus:outline-none"
                    />
                    {errors.image && <p className="text-red-500 text-sm mt-1">La URL de la imagen es obligatoria</p>}
                </div>

                {/* Botón para crear o actualizar el producto */}
                <button
                    type='submit'
                    className={`w-full p-2 rounded-md transition duration-200 ${isUpdate ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                >
                    {isUpdate ? 'Actualizar Producto' : 'Crear Producto'}
                </button>
            </form>
        </div>
    );
}

export default FormProducts;

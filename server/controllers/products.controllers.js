import Product from '../models/products.model.js';
import Sale from '../models/sale.model.js';

// Crear un nuevo producto
export const createProduct = async (req, res) => {
    try {
        const { code, title, marca, description, price, quantity, category, image } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'El código del producto es obligatorio' });
        }
        const newProduct = new Product({
            code,
            title,
            marca,
            description,
            price,
            quantity,
            category,
            image
        });

        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el producto', error });
    }
};

// Obtener todos los productos
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los productos', error });
    }
};

// Obtener un producto por su ID
export const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'No existe ese producto!' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto', error });
    }
};

// Obtener un producto por su CODE
export const getProductByCode = async (req, res) => {
    try {
        const product = await Product.findOne({ code: req.params.code });
        if (!product) return res.status(404).json({ message: 'No existe ese producto!' });
        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener el producto', error });
    }
};

// Actualizar un producto por su ID
export const updateProduct = async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).json({ message: 'No existe ese producto!' });
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto', error });
    }
};
//Actualizar un producto por su codigo
export const updateProductByCode = async (req, res) => {
    try {
        const updatedProduct = await Product.findOneAndUpdate(
            { code: req.params.code }, // Buscar por el campo `code`
            req.body,
            { new: true } // Para devolver el producto actualizado
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'No existe ese producto!' });
        }

        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el producto', error });
    }
};

// Eliminar un producto por su codigo
export const sellProducts = async (req, res) => {

    console.log(req.body)
    try {
        const { quantityToSell } = req.body;
        const { code } = req.params

        // Obtener el producto actual
        const product = await Product.findOne({ code });

        if (!product) {
            return res.status(404).json({ message: "Producto no encontrado" });
        }

        // Asegúrate de que sellQuantity sea un número
        const quantitySell = Number(quantityToSell);

        if (isNaN(quantitySell) || quantitySell <= 0) {
            return res.status(400).json({ message: "Cantidad a vender no válida" });
        }

        // Actualizar la cantidad solo si la cantidad es suficiente
        if (product.quantity >= quantityToSell) {
            product.quantity -= quantityToSell;
        } else {
            return res.status(400).json({ message: "No hay suficiente cantidad disponible para vender" });
        }

        await product.save();
        res.status(200).json({ message: "Producto vendido con éxito", product });
    } catch (error) {
        console.error("Error al vender el producto", error);
        res.status(500).json({ message: "Error al vender producto", error });
    }
}

// Eliminar un producto por su ID
export const deleteProduct = async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: 'No existe ese producto!' });
        res.status(204).json({ message: 'Producto eliminado correctamente!' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar el producto', error });
    }
};


export const createSale = async (req, res) => {
    try {
        const { customer, price, seller, paymentMethod, product, image, cantidad, dateCreate } = req.body;

        const newSale = new Sale({
            customer,
            price,
            seller,
            paymentMethod,
            product,
            image,
            cantidad,
            dateCreate
        });

        const savedSale = await newSale.save();
        res.status(201).json(savedSale);
    } catch (error) {
        console.error("Error al crear la venta", error);
        res.status(500).json({ message: 'Error al crear la venta' });
    }
};
export const getAllSales = async (req, res) => {
    try {
        const sales = await Sale.find().populate('product customer seller');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las ventas" });
    }
};
import Product from '../models/products.model.js';
import Sale from '../models/sale.model.js';
import SaleWeb from '../models/sale.web.js'
import nodemailer from 'nodemailer'
import Dotenv from 'dotenv'
import { MercadoPagoConfig, Preference } from 'mercadopago'
Dotenv.config()

const client = new MercadoPagoConfig({
    accessToken: process.env.TOKEN_MP
})


const transport = nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
})


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
export const updateStock = async (req, res) => {
    try {
        const { email, products, total, seller, telfone } = req.body;

        // Array para acumular errores
        let errors = [];

        // Actualizar el stock de los productos
        await Promise.all(products.map(async ({ code, quantityToSell }) => {
            const product = await Product.findOne({ code: Number(code) });
            if (!product) {
                errors.push(`Producto con código ${code} no encontrado`);
                return;
            }

            const quantitySell = Number(quantityToSell);
            if (isNaN(quantitySell)) {
                errors.push(`Cantidad a vender no válida para el producto ${code}`);
                return;
            }

            if (product.quantity < quantitySell) {
                errors.push(`No hay suficiente cantidad para el producto ${code}`);
                return;
            }

            product.quantity -= quantitySell;
            await product.save();
        }));

        // Si hubo errores, enviar respuesta con los errores acumulados
        if (errors.length > 0) {
            return res.status(400).json({ message: 'Errores al procesar algunos productos', errors });
        }

        // Crear la preferencia de MercadoPago
        const body = {
            items: products.map(product => ({
                title: product.title,
                quantity: product.quantityToSell,
                unit_price: product.price,
                currency_id: "ARS" // Moneda
            })),
            back_urls: {
                success: 'https://www.youtube.com',
                failure: 'https://www.facebook.com',
                pending: 'https://www.youtube.com',
            },
            auto_return: "approved",
        };

        const preference = new Preference(client);
        const result = await preference.create({ body });

        // Solo continuar si existe result.id (la preferencia se creó correctamente)
        if (!result.id) {
            return res.status(500).json({ message: 'Error al crear la preferencia de pago' });
        }

        // Guardar la venta en la base de datos solo si existe result.id
        const newSale = new SaleWeb({
            email,
            products,
            total,
            seller,
            telfone,
            Idventa: result.id // ID de la venta generada por MercadoPago
        });

        const savedSale = await newSale.save();

        // Función para enviar el correo electrónico
        const sendEmail = async ({ email, subject, html }) => {
            return await transport.sendMail({
                from: 'ZachSuplementos <zachsuplementos@gmail.com>',
                to: email,
                subject,
                html
            });
        };

        // Enviar el correo solo después de que se haya guardado la venta
        await sendEmail({
            email,
            subject: 'Compra Zach suplementos',
            html: `<!DOCTYPE html>
            <html lang="es">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
            body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f6f6f6;
            }
            .container {
                width: 100%;
                background-color: #ffffff;
                padding: 20px;
                margin: auto;
                max-width: 600px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                padding: 20px;
            }
            .header img {
                max-width: 200px;
            }
            .content {
                padding: 20px;
            }
            .footer {
                text-align: center;
                padding: 10px;
                font-size: 12px;
                color: #777;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                margin-top: 20px;
                background-color: #007BFF;
                color: black;
                text-decoration: none;
                border-radius: 5px;
            }
            .product-list {
                margin-top: 20px;
            }
            .product-list li {
                padding: 10px;
                border: 1px solid #ddd;
                margin-bottom: 10px;
                border-radius: 5px;
            }
            </style>
            </head>
            <body>
            <div class="container">
            <div class="header">
                <img src="https://lh3.googleusercontent.com/a/ACg8ocKFa81Rqw3aSmWA2XAii0RFptkRmrN8Jem0QW8bxcvRZutkxM4=s432-c-no" alt="Logo de tu empresa">
            </div>
            <div class="content">
                <h2>¡Gracias por tu compra, ${email}!</h2>
                <p>Nos alegra informarte que hemos recibido tu pedido: ${result.id}. A continuación, encontrarás los detalles:</p>
                <ul>
                    <li><strong>Total de la compra:</strong> $${total}</li>
                    <li><strong>Vendedor:</strong> ${seller}</li>
                    <li><strong>Teléfono:</strong> ${telfone}</li>
                </ul>
                <p>Aquí están los productos que compraste:</p>
                <ul class="product-list">
                    ${products.map(product => `
                        <li>
                            <strong>Código:</strong> ${product.code} <br>
                            <strong>Cantidad a vender:</strong> ${product.quantityToSell}
                        </li>
                    `).join('')}
                </ul>
                <p>Estamos trabajando para procesar tu pedido lo antes posible.</p>
                <a href="https://wa.me/543624018233" class="button">Contáctanos</a>
            </div>
            <div class="footer">
                <p>Gracias por elegir Zach Suplementos.</p>
                <p>&copy; ${new Date().getFullYear()} Zach Suplementos. Todos los derechos reservados.</p>
            </div>
            </div>
            </body>
            </html>
            `
        });

        // Enviar respuesta exitosa
        res.status(200).json({ message: 'Venta realizada con éxito', id: result.id });

    } catch (error) {
        console.error("Error al vender productos", error);
        res.status(500).json({ message: "Error al vender productos", error });
    }
};


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



export const sendMail = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body
        const sendEmail = async ({ email, subject, html }) => {
            return await transport.sendMail({
                from: 'ZachBussines <zachsuplementos@gmail.com>',
                to: email,
                subject,
                html
            });
        };

        // Llama a la función para enviar el correo
        await sendEmail({
            email: "suplementoszach@gmail.com",
            subject: `${subject}`,
            html: `<p>${email} Nombre:${name} <br> ${message}</p>`


        })
        res.status(200).json({ message: 'mensaje enviado con exito' });
    }
    catch (error) { res.status(500).json({ message: "Error al enviar mensaje", error }); }



}







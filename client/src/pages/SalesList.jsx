import { useState, useEffect } from 'react';
import { getAllSalesRequest } from '../api/products';

// Función para formatear la fecha
const formatDate = (isoString) => {
  const date = new Date(isoString);

  const formattedDate = date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return `${formattedDate} a las ${formattedTime}`;
};

function SalesList() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Función para obtener todas las ventas
    const fetchSales = async () => {
      try {
        const response = await getAllSalesRequest();
        setSales(response.data);  // Guardar las ventas en el estado
        setLoading(false);
      } catch (err) {
        console.error("Error al obtener las ventas:", err);
        setError("Hubo un error al cargar las ventas");
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  console.log(sales);
  if (loading) return <p>Cargando ventas...</p>;
  if (error) return <p>{error}</p>;

  // Calcular el total de todas las ventas
  const totalSales = sales.reduce((total, sale) => total + (sale.price * sale.cantidad), 0);

  return (
    <div className="sales-list">
      <h2 className="text-xl font-semibold mb-4">Lista de Ventas</h2>
      <ul className="space-y-2">
        {sales.map((sale) => (
          <li key={sale._id} className="p-4 bg-white shadow rounded-md max-w-[400px]">
            <div className="flex justify-between items-start"> {/* Flexbox container */}
              <div className="flex-1"> {/* Left side with text */}
                <h3 className="text-lg font-semibold text-gray-800">Venta de: {sale.product}</h3>
                <p className="text-gray-800"><strong>Cliente:</strong> {sale.customer}</p>
                <p className="text-gray-800"><strong>Vendedor:</strong> {sale.seller}</p>
                <p className="text-gray-800"><strong>Fecha Creacion:</strong> {formatDate(sale.dateCreate)}</p>
                {/* Formatear la fecha usando la función formatDate */}
                <p className="text-gray-800"><strong>Fecha venta:</strong> {formatDate(sale.date)}</p>
                <p className="text-gray-800"><strong>Método de Pago:</strong> {sale.paymentMethod}</p>
                <p className="text-gray-800"><strong>Cantidad:</strong> {sale.cantidad}</p>
                <p className="text-gray-800"><strong>Precio total:</strong> ${sale.price * sale.cantidad}</p>
              </div>

              <div className="ml-4"> {/* Right side with image */}
                <img className="w-32 h-42 object-cover" src={sale.image} alt="producto vendido" />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <h3 className="text-lg font-bold text-white w-52 h-52">Total Vendido: ${totalSales}</h3>
      </div>
    </div>
  );
}

export default SalesList;

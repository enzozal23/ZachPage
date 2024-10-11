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
  const [showAll, setShowAll] = useState(false); // Estado para manejar si mostrar todas las ventas o no
  const [startDate, setStartDate] = useState(""); // Fecha de inicio para el filtro
  const [endDate, setEndDate] = useState(""); // Fecha de fin para el filtro
  const [seller, setSeller] = useState(""); // Estado para el filtro por vendedor

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

  if (loading) return <div className="flex justify-center items-center h-screen">
    <svg className="animate-spin h-20 w-20 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
    </svg>
  </div>
    ;
  if (error) return <p>{error}</p>;

  // Función para filtrar las ventas según las fechas seleccionadas y vendedor
  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    // Verifica si la fecha de la venta está entre la fecha de inicio y fin
    const isWithinDateRange = !start || !end || (saleDate >= start && saleDate <= end);

    // Verifica si el vendedor coincide si se seleccionó alguno
    const matchesSeller = !seller || sale.seller === seller;

    return isWithinDateRange && matchesSeller;
  });

  // Mostrar las últimas 3 ventas o todas las ventas (filtradas)
  const displayedSales = showAll ? filteredSales : filteredSales.slice(-3);

  // Calcular el total de todas las ventas filtradas
  const totalSales = filteredSales.reduce((total, sale) => total + (sale.price * sale.cantidad), 0);

  return (
    <div className="sales-list">
      <h2 className="text-xl font-semibold mb-4">Lista de Ventas</h2>

      {/* Filtro de fecha */}
      <div className="flex gap-4 mb-4">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-white">Fecha de Inicio</label>
          <input
            type="date"
            id="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-white">Fecha de Fin</label>
          <input
            type="date"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black"
          />
        </div>
      </div>

      {/* Filtro por vendedor */}
      <div className="mb-4">
        <label htmlFor="seller" className="block text-sm font-medium text-white">Vendedor</label>
        <select
          id="seller"
          value={seller}
          onChange={(e) => setSeller(e.target.value)}
          className="mt-1 block w-36 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black "
        >
          <option value="" >Todos</option>
          <option value="Ricardo">Ricardo</option>
          <option value="Enzo">Enzo</option>
        </select>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-bold text-white">Total Vendido: ${totalSales}</h3>
      </div>

      {/* Botón para alternar entre ver las últimas 3 ventas o todas */}
      <div className="mt-4">
        <button
          onClick={() => setShowAll(!showAll)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors mb-2"
        >
          {showAll ? "Mostrar últimas 3 ventas" : "Mostrar todas las ventas"}
        </button>
      </div>

      <ul className="space-y-2">
        {displayedSales.map((sale) => (
          <li key={sale._id} className="p-4 bg-white shadow rounded-md max-w-[400px]">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">Venta de: {sale.product}</h3>
                <p className="text-gray-800"><strong>Cliente:</strong> {sale.customer}</p>
                <p className="text-gray-800"><strong>Vendedor:</strong> {sale.seller}</p>
                <p className="text-gray-800"><strong>Fecha Creacion:</strong> {formatDate(sale.dateCreate)}</p>
                <p className="text-gray-800"><strong>Fecha venta:</strong> {formatDate(sale.date)}</p>
                <p className="text-gray-800"><strong>Método de Pago:</strong> {sale.paymentMethod}</p>
                <p className="text-gray-800"><strong>Cantidad:</strong> {sale.cantidad}</p>
                <p className="text-gray-800"><strong>Precio total:</strong> ${sale.price * sale.cantidad}</p>
              </div>
              <div className="ml-4">
                <img className="w-32 h-42 object-cover" src={sale.image} alt="producto vendido" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SalesList;

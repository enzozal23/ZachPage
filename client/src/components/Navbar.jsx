import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"



function Navbar() {
    const { isAuthenticated, logout, user } = useAuth()
    return (
        <nav className="bg-zinc-700 my-3 flex justify-between items-center py-4 px-8 rounded-lg shadow-lg">
            <Link to="/" className="text-white text-2xl font-bold hover:text-yellow-400 transition-colors duration-300">
                Zach Suplementos
            </Link>

            <ul className="flex items-center gap-x-4 text-white">
                {isAuthenticated ? (
                    <>
                        <li className="text-sm font-light">
                            <span className="font-semibold text-yellow-300">Usuario:</span> {user.username}
                        </li>
                        <li>
                            <Link to="/FormProducts" className="hover:text-yellow-400 transition-colors duration-300">
                                Agregar/Actualizar Producto
                            </Link>
                        </li>
                        <li>
                            <Link to="/ventas" className="hover:text-yellow-400 transition-colors duration-300">
                                Ventas
                            </Link>
                        </li>
                        <li>
                            <Link to="/vender" className="hover:text-yellow-400 transition-colors duration-300">
                                Vender
                            </Link>
                        </li>
                        <li>
                            <Link to="/task/new" className="hover:text-yellow-400 transition-colors duration-300">
                                Añadir Tarea
                            </Link>
                        </li>
                        <li>
                            <Link to="/task/new" className="hover:text-yellow-400 transition-colors duration-300">
                                Tareas
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/"
                                onClick={() => logout()}
                                className="hover:text-red-400 transition-colors duration-300"
                            >
                                Logout
                            </Link>
                        </li>
                    </>
                ) : (
                    <>
                        <li>
                            <Link to="/login" className="hover:text-yellow-400 transition-colors duration-300">
                                Login
                            </Link>
                        </li>
                        <li>
                            <Link to="/register" className="hover:text-yellow-400 transition-colors duration-300">
                                Registro
                            </Link>
                        </li>
                    </>
                )}
            </ul>
        </nav>
    )
}

export default Navbar


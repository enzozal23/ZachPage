import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { useState } from "react"
import zachLogo from "../../images/zachLogo.png"

function Navbar() {
    const { isAuthenticated, logout, user } = useAuth()
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div className="relative">
            <nav className="bg-zinc-700 my-3 flex justify-between items-center py-4 px-8 rounded-lg shadow-lg relative z-10">
                <Link to="/products" className="text-white text-2xl font-bold hover:text-yellow-400 transition-colors duration-300">
                    <img src={zachLogo} alt="Home" className="w-32" />
                </Link>

                {/* Links normales para pantallas grandes */}
                <ul className={`flex-col lg:flex-row  lg:items-center gap-x-4 text-white hidden lg:flex`}>
                    {isAuthenticated ? (
                        <>
                            <li className="bg-blue-400 text-black px-4 py-2">
                                <span className="font-semibold text-2xl text-white">Admin: {user.username}</span>
                            </li>
                            <li>
                                <Link
                                    to="/FormProducts"
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-blue-300 transition-colors duration-300 lg:mt-0 mt-2"
                                >
                                    Agregar/Actualizar
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/products"
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-blue-300 transition-colors duration-300"
                                >
                                    productos
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/ventas"
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-blue-300 transition-colors duration-300 lg:mt-0 mt-2"
                                >
                                    Ventas
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/vender"
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-blue-300 transition-colors duration-300 lg:mt-0 mt-2"
                                >
                                    Vender
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/"
                                    onClick={() => logout()}
                                    className="bg-red-400 text-white px-4 py-2 hover:bg-red-500 transition-colors duration-300 lg:mt-0 mt-2"
                                >
                                    Logout
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link
                                    to="/login"
                                    className="bg-blue-500  px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-300 lg:mt-0 mt-2 font-bold text-white"
                                >
                                    Login
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            </nav>

            {/* Botón hamburguesa fuera del nav */}
            <button
                className="text-white lg:hidden absolute top-5 right-5 z-20 pt-5"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
            </button>

            {/* Menú desplegable para móviles */}
            {menuOpen && (
                <ul className="flex flex-col items-center gap-y-4 text-white bg-zinc-700 py-6 rounded-lg shadow-lg absolute top-16 left-0 w-full z-10 lg:hidden mt-8">
                    {isAuthenticated ? (
                        <>
                            <li className="text-xl text-white">Admin: {user.username}</li>
                            <li>
                                <Link
                                    to="/FormProducts"
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-blue-300 transition-colors duration-300"
                                >
                                    Agregar/Actualizar
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/products"
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-blue-300 transition-colors duration-300"
                                >
                                    productos
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/ventas"
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-blue-300 transition-colors duration-300"
                                >
                                    Ventas
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/vender"
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-blue-300 transition-colors duration-300"
                                >
                                    Vender
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/"
                                    onClick={() => logout()}
                                    className="bg-red-400 text-white px-4 py-2 hover:bg-red-500 transition-colors duration-300"
                                >
                                    Logout
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link
                                    to="/login"
                                    className="bg-yellow-400 text-black px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors duration-300"
                                >
                                    Login
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            )}
        </div>
    )
}

export default Navbar

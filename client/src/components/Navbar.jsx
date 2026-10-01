import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

function Navbar() {
    const { isAuthenticated, logout, user } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    // Función para cerrar el menú cuando se hace clic en un link
    const closeMenu = () => setMenuOpen(false);

    return (
        <div className="relative">
            <nav className="bg-[#3c2678] my-3 flex justify-between items-center py-4 px-8 rounded-lg shadow-lg relative z-10">
                <Link
                    to="/"
                    onClick={closeMenu} // Cerrar el menú al hacer clic en el logo
                    className="text-white text-2xl font-bold hover:text-[#e4deff] transition-colors duration-300"
                >
                    Lexora
                </Link>

                {/* Links normales para pantallas grandes */}
                <ul className={`flex-col lg:flex-row  lg:items-center gap-x-4 text-white hidden lg:flex`}>
                    {isAuthenticated ? (
                        <>
                            <li className="bg-[#7e76f0] text-black px-4 py-2">
                                <span className="font-semibold text-2xl text-white">Admin: {user.username}</span>
                            </li>
                            <li>
                                <Link
                                    to="/"
                                    onClick={closeMenu}
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-[#7e76f0] transition-colors duration-300 lg:mt-0 mt-2"
                                >
                                    Lexora
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/monitoreo/sistema"
                                    onClick={closeMenu}
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-[#7e76f0] transition-colors duration-300 lg:mt-0 mt-2"
                                >
                                    Logs
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/"
                                    onClick={() => {
                                        logout();
                                        closeMenu(); // Cerrar el menú al hacer logout
                                    }}
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
                                    to="/"
                                    onClick={closeMenu} // Cerrar el menú al hacer clic
                                    className="bg-[#6c4ce6] px-4 py-2 rounded-lg hover:bg-[#7e76f0] transition-colors duration-300 lg:mt-0 mt-2 font-bold text-white"
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
                <ul className="flex flex-col items-center gap-y-4 text-white bg-[#3c2678] py-6 rounded-lg shadow-lg absolute top-16 left-0 w-full z-10 lg:hidden mt-8">
                    {isAuthenticated ? (
                        <>
                            <li className="text-xl text-white">Admin: {user.username}</li>
                            <li>
                                <Link
                                    to="/"
                                    onClick={closeMenu}
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-[#7e76f0] transition-colors duration-300"
                                >
                                    Lexora
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/monitoreo/sistema"
                                    onClick={closeMenu}
                                    className="text-white font-semibold text-1xl px-4 py-2 border-2 hover:bg-[#7e76f0] transition-colors duration-300"
                                >
                                    Logs
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/"
                                    onClick={() => {
                                        logout();
                                        closeMenu(); // Cerrar el menú al hacer logout
                                    }}
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
                                    to="/"
                                    onClick={closeMenu} // Cerrar el menú al hacer clic
                                    className="bg-[#7e76f0] text-white px-4 py-2 rounded-lg hover:bg-[#6c4ce6] transition-colors duration-300"
                                >
                                    Login
                                </Link>
                            </li>
                        </>
                    )}
                </ul>
            )}
        </div>
    );
}

export default Navbar;


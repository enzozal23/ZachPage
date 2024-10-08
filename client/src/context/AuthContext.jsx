import { createContext, useState, useContext, useEffect } from "react";
import { registerRequest, loginRequest, verifyTokenRequest } from '../api/auth'
import Cookies from 'js-cookie'
const AuthContext = createContext()
export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider" + 'line 7 AuthContext.js')
    }
    return context
}


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [errors, setErrors] = useState([])
    const [loading, setLoading] = useState(true)

    const signup = async (user) => {
        try {
            const res = await registerRequest(user)
            console.log(res.data)
            setUser(res.data)
            setIsAuthenticated(true)
        } catch (error) {
            console.log(error.response.data)
            setErrors(error.response.data)
        }
    }
    // ⬆️⬇️estas funciones pasan del front los datos (user) hacia el front a traves de auth.js donde estan las direcciones de la api y setean los errores

    const signin = async (user) => {
        try {
            const res = await loginRequest(user)
            console.log(res)
            setIsAuthenticated(true)
            setUser(res.data)
        } catch (error) {
            if (Array.isArray(error.response.data)) {
                return setErrors(error.response.data)
            }
            setErrors([error.response.data.message])
        }
    }
    const logout = () => {
        Cookies.remove('token')
        setIsAuthenticated(false)
        setUser(null)
    }

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => { setErrors([]) }, 3000);
            return () => clearTimeout(timer)
        }
    }, [errors])//timeout para que desaparescan los errorres en 1 segundo


    useEffect(() => {// COOKIES TOKEN
        async function checkLogin() {
            const cookies = Cookies.get(); // busca con js-coookie si hay alguna cookie en el navegador 

            if (!cookies.token) {
                setIsAuthenticated(false) //si no hay token setea todo en false
                setLoading(false);

                return setUser(null)
            }
            try {
                const res = await verifyTokenRequest(cookies.token) // peror si hay token con verifyTokenRequest verifica que este en la base de datos
                console.log(res)
                if (!res.data) {
                    setIsAuthenticated(false) // si no coinciden el token de la base de datos con la del navegador vuelve a setear en false 
                    setLoading(false);
                    return
                }
                setIsAuthenticated(true) // de lo contrario setea  en true y el user con los datos 
                setUser(res.data)
                setLoading(false)

            } catch (error) {
                setIsAuthenticated(false), // error que viene de la base de datos
                    setUser(null)
                setLoading(false)
            }
        }
        checkLogin()
    }, [])

    return (//context para poder compartir todos los datos en las distintas paginas de la website
        <AuthContext.Provider value={{ signup, signin, logout, loading, user, isAuthenticated, errors }}>
            {children}
        </AuthContext.Provider>
    )
}
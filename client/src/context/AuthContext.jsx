import { createContext, useState, useContext, useEffect } from "react";
import { loginRequest, logoutRequest, verifyTokenRequest } from '../api/auth'
const AuthContext = createContext()

function clearToken() {
    try {
        localStorage.removeItem('token')
        sessionStorage.removeItem('tablero-kanban:token')
    } catch {
        // la sesión vive en la cookie httpOnly
    }
}

function readError(error) {
    const data = error.response?.data
    if (Array.isArray(data)) return data
    if (data?.message) return [data.message]
    return ['No se pudo conectar con el servidor.']
}
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

    const signin = async (user) => {
        try {
            const res = await loginRequest(user)
            clearToken()
            setIsAuthenticated(true)
            setUser(res.data)
        } catch (error) {
            setErrors(readError(error))
        }
    }
    const refreshProfile = async () => {
        const res = await verifyTokenRequest()
        if (res.data) setUser(res.data)
    }

    const logout = async () => {
        try {
            await logoutRequest()
        } catch {
            // igual cerramos la sesión local
        } finally {
            clearToken()
            setIsAuthenticated(false)
            setUser(null)
        }
    }

    useEffect(() => {
        if (errors.length > 0) {
            const timer = setTimeout(() => { setErrors([]) }, 3000);
            return () => clearTimeout(timer)
        }
    }, [errors])//timeout para que desaparescan los errorres en 1 segundo


    useEffect(() => {
        async function checkLogin() {
            try {
                const res = await verifyTokenRequest()
                if (!res.data) {
                    clearToken()
                    setIsAuthenticated(false)
                    setUser(null)
                    return
                }
                setIsAuthenticated(true)
                setUser(res.data)
            } catch (error) {
                if (error.response?.status === 401) clearToken()
                setIsAuthenticated(false)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        checkLogin()
    }, [])

    return (//context para poder compartir todos los datos en las distintas paginas de la website
        <AuthContext.Provider value={{ signin, logout, refreshProfile, loading, user, isAuthenticated, errors }}>
            {children}
        </AuthContext.Provider>
    )
}
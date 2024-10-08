import React from 'react'
import { useAuth } from './context/AuthContext'
import { Navigate, Outlet } from 'react-router-dom'

function ProtectedRoute() {
    const { loading, isAuthenticated } = useAuth()


    if (loading) return <h1>loading...</h1>
    if (!loading && !isAuthenticated) return <Navigate to='/login' />

    return <Outlet /> //esta etiqueta de xml permite pasar directamente a las rutas que encapsula ProtectedRoute

}

export default ProtectedRoute

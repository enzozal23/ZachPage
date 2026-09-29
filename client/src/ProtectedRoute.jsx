import React from 'react'
import { useAuth } from './context/AuthContext'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

function ProtectedRoute() {
    const { loading, isAuthenticated } = useAuth()
    const location = useLocation()

    if (loading) return <h1>loading...</h1>
    if (!isAuthenticated) return <Navigate to='/login' state={{ from: location }} replace />

    return <Outlet />

}

export default ProtectedRoute

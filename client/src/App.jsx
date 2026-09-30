

import { lazy, Suspense } from 'react'
import { Routes, Route, BrowserRouter, useLocation } from 'react-router-dom'
// import RegisterPage from './pages/RegisterPage.jsx'
// import LoginPage from './pages/LoginPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
// import TaskPage from './pages/TaskPage.jsx'
// import TaskFormPage from './pages/TaskFormPage.jsx'
// import ProfilePage from './pages/ProfilePage.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import { ProductsProvider } from './context/ProductsContext.jsx'
import Navbar from './components/Navbar.jsx'
// import Products from './pages/Products.jsx'
import NotFound from './pages/NotFound.jsx'
// import FormProducts from './pages/FormProducts.jsx'
// import SellProductForm from './pages/SellProductForm.jsx'
// import SalesList from './pages/SalesList.jsx'
// import HomePage from './pages/HomePage.jsx'
// import SaleWebList from './pages/SaleWebList.jsx'
import LogsPage from './pages/LogsPage.jsx'

const TableroKanban = lazy(() => import('./tablero/App.jsx'))

function AppShell() {
  const { pathname } = useLocation()
  const isTablero = pathname === '/' || pathname === '/tablero' || pathname === '/importaciones' || pathname === '/monitoreo' || pathname === '/configuraciones' || pathname.startsWith('/t/')

  return (
    <>
      {!isTablero && <Navbar />}
      <Routes>

              <Route
                element={
                  <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#f3f0fc] text-[#5c5188]">Cargando Lexora…</div>}>
                    <TableroKanban />
                  </Suspense>
                }
              >
                <Route path="/" />
                <Route path="/tablero" />
                <Route path="/importaciones" />
                <Route path="/monitoreo" />
                <Route path="/configuraciones" />
                <Route path="/t/:ticketId" />
              </Route>
              {/* Ecommerce
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/products" element={<Products />} />
              */}

              <Route element={<ProtectedRoute />}>
                {/* <Route path="/tasks" element={<TaskPage />} />
                <Route path="/task/new" element={<TaskFormPage />} />
                <Route path="/task/:id" element={<TaskFormPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/FormProducts" element={<FormProducts />} />
                <Route path="/vender" element={<SellProductForm />} />
                <Route path="/ventas" element={<SalesList />} />
                <Route path="/ventasWeb" element={<SaleWebList />} /> */}
                <Route path="/logs" element={<LogsPage />} />
              </Route>
              <Route path='*' element={<NotFound />} />
            </Routes>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <ProductsProvider>
          <BrowserRouter>
            <AppShell />
          </BrowserRouter>
        </ProductsProvider>
      </TaskProvider>
    </AuthProvider>
  )
}

export default App


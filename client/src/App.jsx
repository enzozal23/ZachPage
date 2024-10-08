

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RegisterPage from './pages/registerPage'
import LoginPage from './pages/LoginPage'
import { AuthProvider } from './context/AuthContext'
import TaskPage from './pages/TaskPage'
import TaskFormPage from './pages/TaskFormPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './ProtectedRoute'
import { TaskProvider } from './context/TaskContext'
import { ProductsProvider } from './context/ProductsContext'
import Navbar from './components/Navbar'
import Products from './pages/Products'
import NotFound from './pages/NotFound'
import FormProducts from './pages/FormProducts'
import SellProductForm from './pages/SellProductForm'
import SalesList from './pages/SalesList'

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <ProductsProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>

              <Route path="/" element={<h1>home page</h1>} />
              <Route path="/register" element={<RegisterPage />} />           {/*  RUTAS PUBLICAS  */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/products" element={<Products />} />


              <Route element={<ProtectedRoute />}>
                <Route path="/tasks" element={<TaskPage />} />
                <Route path="/task/new" element={<TaskFormPage />} />         {/* RUTAS PRIVADAS */}
                <Route path="/task/:id" element={<TaskFormPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/FormProducts" element={<FormProducts />} />
                <Route path="/vender" element={<SellProductForm />} />
                <Route path="/ventas" element={<SalesList />} />

              </Route>
              <Route path='*' element={<NotFound />} />
            </Routes>



          </BrowserRouter>
        </ProductsProvider>
      </TaskProvider>
    </AuthProvider>
  )
}

export default App


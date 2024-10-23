

import { Routes, Route, HashRouter } from 'react-router-dom'
import RegisterPage from './pages/RegisterPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import TaskPage from './pages/TaskPage.jsx'
import TaskFormPage from './pages/TaskFormPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import { ProductsProvider } from './context/ProductsContext.jsx'
import Navbar from './components/Navbar.jsx'
import Products from './pages/Products.jsx'
import NotFound from './pages/NotFound.jsx'
import FormProducts from './pages/FormProducts.jsx'
import SellProductForm from './pages/SellProductForm.jsx'
import SalesList from './pages/SalesList.jsx'
import HomePage from './pages/HomePage.jsx'
import SaleWebList from './pages/SaleWebList.jsx'

function App() {
  return (
    <AuthProvider>
      <TaskProvider>
        <ProductsProvider>
          <HashRouter>
            <Navbar />
            <Routes>

              <Route path="/" element={<HomePage />} />
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
                <Route path="/ventasWeb" element={<SaleWebList />} />


              </Route>
              <Route path='*' element={<NotFound />} />
            </Routes>



          </HashRouter>
        </ProductsProvider>
      </TaskProvider>
    </AuthProvider>
  )
}

export default App


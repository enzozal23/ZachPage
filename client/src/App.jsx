import { lazy, Suspense } from 'react'
import { Routes, Route, BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import NotFound from './pages/NotFound.jsx'

const TableroKanban = lazy(() => import('./tablero/App.jsx'))

function AppShell() {
  return (
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
        <Route path="/monitoreo/*" />
        <Route path="/logs" />
        <Route path="/configuraciones" />
        <Route path="/usuarios" />
        <Route path="/permisos" />
        <Route path="/clientes" />
        <Route path="/novedades" />
        <Route path="/t/:ticketId" />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App

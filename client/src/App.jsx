

import { lazy, Suspense } from 'react'
import { Routes, Route, BrowserRouter, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
// import TaskPage from './pages/TaskPage.jsx'
// import TaskFormPage from './pages/TaskFormPage.jsx'
// import ProfilePage from './pages/ProfilePage.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import { TaskProvider } from './context/TaskContext.jsx'
import Navbar from './components/Navbar.jsx'
import NotFound from './pages/NotFound.jsx'
import LogsPage from './pages/LogsPage.jsx'

const TableroKanban = lazy(() => import('./tablero/App.jsx'))

function AppShell() {
  const { pathname } = useLocation()
  const isTablero = pathname === '/' || pathname === '/tablero' || pathname === '/importaciones' || pathname === '/monitoreo' || pathname === '/configuraciones' || pathname === '/usuarios' || pathname === '/novedades' || pathname.startsWith('/t/')

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
                <Route path="/usuarios" />
                <Route path="/novedades" />
                <Route path="/t/:ticketId" />
              </Route>
              <Route element={<ProtectedRoute />}>
                {/* <Route path="/tasks" element={<TaskPage />} />
                <Route path="/task/new" element={<TaskFormPage />} />
                <Route path="/task/:id" element={<TaskFormPage />} />
                <Route path="/profile" element={<ProfilePage />} /> */}
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
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </TaskProvider>
    </AuthProvider>
  )
}

export default App


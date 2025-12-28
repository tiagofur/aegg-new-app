import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import AdminUsersPage from './pages/AdminUsersPage'
import { TrabajosPage } from './pages/TrabajosPage'
import { ReporteAnualPage } from './pages/ReporteAnualPage'
import { ReporteMensualPage } from './pages/ReporteMensualPage'
import { ReporteBaseAnualPage } from './pages/ReporteBaseAnualPage'
import { ClientesPage } from './pages/ClientesPage'
import { AprobacionesPage } from './pages/AprobacionesPage'
import PrivateRoute from './components/PrivateRoute'

function App() {
    return (
        <AuthProvider>
            <Router
                future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                }}
            >
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/trabajos"
                        element={
                            <PrivateRoute>
                                <Outlet />
                            </PrivateRoute>
                        }
                    >
                        <Route index element={<TrabajosPage />} />
                        <Route
                            path="aprobaciones"
                            element={
                                <PrivateRoute allowedRoles={['Gestor', 'Admin']}>
                                    <AprobacionesPage />
                                </PrivateRoute>
                            }
                        />
                        <Route path=":trabajoId" element={<TrabajosPage />} />
                        <Route
                            path=":trabajoId/reporte-mensual/:mesId/:reporteId/:tipo"
                            element={<ReporteMensualPage />}
                        />
                        <Route
                            path=":trabajoId/reporte-base-anual"
                            element={<ReporteBaseAnualPage />}
                        />
                        <Route
                            path=":trabajoId/reporte-anual/:anio"
                            element={<ReporteAnualPage />}
                        />
                    </Route>
                    <Route
                        path="/clientes"
                        element={
                            <PrivateRoute allowedRoles={['Admin', 'Gestor']}>
                                <ClientesPage />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/admin/users"
                        element={
                            <PrivateRoute allowedRoles={['Admin']}>
                                <AdminUsersPage />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App

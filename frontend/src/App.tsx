import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminUsersPage from "./pages/AdminUsersPage";
import { TrabajosPage } from "./pages/TrabajosPage";
import { ReporteAnualPage } from "./pages/ReporteAnualPage";
import { ReporteMensualPage } from "./pages/ReporteMensualPage";
import { ReporteBaseAnualPage } from "./pages/ReporteBaseAnualPage";
import PrivateRoute from "./components/PrivateRoute";

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
                <TrabajosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trabajos/:trabajoId"
            element={
              <PrivateRoute>
                <TrabajosPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trabajos/:trabajoId/reporte-anual/:anio"
            element={
              <PrivateRoute>
                <ReporteAnualPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trabajos/:trabajoId/reporte-base-anual"
            element={
              <PrivateRoute>
                <ReporteBaseAnualPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/trabajos/:trabajoId/reporte-mensual/:mesId/:reporteId/:tipo"
            element={
              <PrivateRoute>
                <ReporteMensualPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute allowedRoles={["Admin"]}>
                <AdminUsersPage />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

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
import { Trabajos } from "./pages/Trabajos";
import { TrabajoDetail } from "./pages/TrabajoDetail";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
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
                <Trabajos />
              </PrivateRoute>
            }
          />
          <Route
            path="/trabajos/:id"
            element={
              <PrivateRoute>
                <TrabajoDetail />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/trabajos" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

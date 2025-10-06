import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { FolderOpen, FileText } from "lucide-react";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-bold text-gray-900">
              Sistema de Reportes Contables
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-bold text-blue-600">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Bienvenido, {user?.name}!
            </h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <button
                onClick={() => navigate("/trabajos")}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-400"
              >
                <FolderOpen className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2 text-xl">
                  Mis Trabajos
                </h3>
                <p className="text-sm text-gray-600">
                  Gestiona tus proyectos y reportes contables
                </p>
              </button>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 opacity-75 border-2 border-gray-300">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2 text-xl">
                  Reportes
                </h3>
                <p className="text-sm text-gray-600">
                  Visualiza y edita tus reportes importados
                </p>
                <p className="text-xs text-gray-500 mt-2">(Próximamente)</p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">
              Funcionalidades Disponibles
            </h3>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>✅ Crear y gestionar trabajos contables</li>
              <li>✅ Importar archivos Excel con reportes</li>
              <li>✅ Soporte para múltiples hojas (tipo mensual)</li>
              <li>🚧 Visualización de datos importados (próximamente)</li>
              <li>🚧 Edición de datos y cálculos (próximamente)</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

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
            <h1 className="text-xl font-bold text-gray-900">Mi Aplicación</h1>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                <div className="text-blue-600 text-3xl mb-2">🎉</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Cuenta Creada
                </h3>
                <p className="text-sm text-gray-600">
                  Tu cuenta ha sido creada exitosamente
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                <div className="text-green-600 text-3xl mb-2">✅</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Autenticado
                </h3>
                <p className="text-sm text-gray-600">
                  Estás correctamente autenticado
                </p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                <div className="text-purple-600 text-3xl mb-2">🚀</div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Listo para Empezar
                </h3>
                <p className="text-sm text-gray-600">
                  Tu aplicación está lista
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-900 mb-2">Próximos pasos</h3>
            <p className="text-gray-600 text-sm">
              Esta es tu página de dashboard. Desde aquí podrás agregar más
              funcionalidades paso a paso conforme vayas desarrollando tu
              aplicación.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

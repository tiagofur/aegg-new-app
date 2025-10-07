// src/App.tsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "./store/index";
import {
  loadUserFromStorage,
  verifyToken,
} from "./features/auth/redux/authStateSlice";
import LoginPage from "./features/auth/pages/LoginPage";
import SignUpPage from "./features/auth/pages/SignUpPage";
import HomePage from "./features/home/pages/HomePage";
import ReportPage from "./features/reporte/pages/ReportPage";
import MainLayout from "./shared/components/MainLayout";
import UsersPage from "./features/users/pages/UsersPage";
import { CircularProgress, Box } from "@mui/material";
import AppSnackbar from "./shared/components/AppSnackbar";

const ProtectedRoute: React.FC = () => {
  const { token, user, isVerifyingToken } = useSelector(
    (state: RootState) => state.authState
  );
  const location = useLocation();

  if (isVerifyingToken) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!token || !user) {
    console.log("ProtectedRoute: No token/user, navigating to login.");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("ProtectedRoute: User authenticated, rendering MainLayout.");
  return <MainLayout />;
};

// --- Componente Contenedor para Rutas Públicas ---
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { token, user, isVerifyingToken } = useSelector(
    (state: RootState) => state.authState
  );

  if (isVerifyingToken) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Si la verificación terminó y hay token/usuario, redirigir a la página principal
  if (token && user) {
    console.log("PublicRoute: User authenticated, navigating to /");
    return <Navigate to="/" replace />;
  }

  // Si no hay token/usuario, renderizar la ruta pública
  console.log("PublicRoute: User not authenticated, rendering public route.");
  return children;
};

// --- Componente Principal App ---
function App() {
  const dispatch = useDispatch<AppDispatch>();
  // Seleccionar directamente los estados necesarios del slice authState
  const { token, isVerifyingToken } = useSelector(
    (state: RootState) => state.authState
  );
  // Estado local para controlar si la verificación inicial ya se intentó
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // 1. Cargar desde localStorage al montar (solo una vez)
  useEffect(() => {
    console.log("App Mount: Dispatching loadUserFromStorage");
    dispatch(loadUserFromStorage());
  }, [dispatch]);

  // 2. Verificar el token desde el estado si existe y la verificación inicial no se ha hecho
  useEffect(() => {
    // Solo intentar verificar si:
    // - Hay un token en el estado Redux
    // - No se está verificando actualmente (evita llamadas duplicadas)
    // - La verificación inicial aún no se ha completado
    if (token && !isVerifyingToken && !initialCheckDone) {
      console.log(
        "App Effect [token]: Initial token found in state, dispatching verifyToken"
      );
      // Despachar verifyToken y marcar la verificación inicial como hecha,
      // independientemente del resultado (éxito o fallo)
      dispatch(verifyToken()).finally(() => {
        console.log(
          "App Effect [token]: verifyToken finished, setting initialCheckDone = true"
        );
        setInitialCheckDone(true);
      });
    } else if (!token && !initialCheckDone) {
      // Si no hay token y la verificación inicial no se ha hecho,
      // marcarla como hecha para no volver a intentarlo innecesariamente.
      console.log(
        "App Effect [token]: No initial token found, setting initialCheckDone = true"
      );
      setInitialCheckDone(true);
    } else if (initialCheckDone) {
      // console.log("App Effect [token]: Initial check already done, skipping verification.");
    } else if (isVerifyingToken) {
      // console.log("App Effect [token]: Verification already in progress, skipping.");
    }
  }, [dispatch, token, isVerifyingToken, initialCheckDone]); // Dependencias clave

  // Renderizar un spinner global si la verificación inicial aún no se ha completado
  // y estamos en el proceso de verificar (evita flash de contenido incorrecto al inicio)
  // Opcional: Podrías mostrar el spinner solo si isVerifyingToken es true Y !initialCheckDone
  // if (isVerifyingToken && !initialCheckDone) {
  //   return (
  //     <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
  //       <CircularProgress />
  //     </Box>
  //   );
  // }
  // Nota: Los componentes ProtectedRoute/PublicRoute ya manejan el spinner durante la verificación,
  // por lo que un spinner global aquí podría ser redundante a menos que quieras cubrir
  // el instante entre la carga inicial y el primer render de las rutas.

  return (
    <>
      <Routes>
        {/* Rutas Públicas envueltas en PublicRoute */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignUpPage />
            </PublicRoute>
          }
        />

        {/* Rutas Protegidas envueltas en ProtectedRoute */}
        {/* ProtectedRoute ahora renderiza MainLayout internamente */}
        <Route path="/" element={<ProtectedRoute />}>
          {/* Rutas anidadas que se renderizarán dentro del Outlet de MainLayout */}
          <Route index element={<HomePage />} />{" "}
          {/* Ruta por defecto para '/' */}
          <Route path="reporte_mensual" element={<ReportPage />} />
          <Route path="users" element={<UsersPage />} />
          {/* Añade más rutas protegidas aquí como hijas de '/' */}
        </Route>

        {/* Ruta Catch-all: Redirige cualquier ruta no encontrada a la raíz */}
        {/* Asegúrate que esta sea la última ruta */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AppSnackbar />
    </>
  );
}

export default App;

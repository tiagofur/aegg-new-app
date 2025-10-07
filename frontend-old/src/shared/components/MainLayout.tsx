import React, { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  useTheme,
  useMediaQuery,
  CssBaseline,
} from '@mui/material';
// Importa los nuevos componentes
import MobileAppBar from './layout/MobileAppBar';
import Sidebar, { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from './layout/Sidebar';
// Importa los iconos y tipos necesarios
import HomeIcon from '@mui/icons-material/Home';
import DownloadIcon from '@mui/icons-material/Download';
// Importa Redux y tipos
import { useSelector } from 'react-redux';
import { CustomMenuItem } from './layout/NavigationMenu'; // O define/importa aquí
import { RootState } from '../../store';

// --- Datos del Menú (podría ir en un archivo separado config/menu.ts) ---
const menuItems: CustomMenuItem[] = [
  { key: 'home', label: 'Inicio', path: '/', icon: <HomeIcon /> },
  {
    key: 'reporte-mensual',
    label: 'Reporte Mensual',
    path: '/reporte_mensual',
    icon: <DownloadIcon />,
  },
  // ... otros items principales ...
];

// --- Helper Function (sin cambios, podría ir a utils/navigation.ts) ---
const findActiveSubMenuKey = (
  items: CustomMenuItem[],
  currentPath: string
): string | null => {
    // ... (tu implementación actual) ...
     for (const item of items) {
      if (item.children) {
        if (item.children.some((child) => child.path === currentPath)) {
          return item.key;
        }
        const foundInChildren = findActiveSubMenuKey(item.children, currentPath);
        if (foundInChildren) {
          // Devolver la clave del padre del submenú activo
          return item.key; // <-- Corrección: Devolver la clave del item actual si se encuentra en sus hijos
        }
      }
    }
    return null;
};

// --- Componente Principal Refactorizado ---
const MainLayout: React.FC = () => {
  const theme = useTheme();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  // Estado para controlar si el drawer está abierto/cerrado
  // Inicialmente cerrado en móvil, abierto en desktop
  const [isDrawerOpen, setIsDrawerOpen] = useState(!isMobile);
  // Estado para controlar qué submenús están abiertos
  const [openSubMenus, setOpenSubMenus] = useState<Record<string, boolean>>({});
  // Obtener usuario del estado global
  const { user } = useSelector((state: RootState) => state.authState);

  // Efecto para ajustar el drawer en cambios de tamaño y abrir submenú activo
  useEffect(() => {
    // Ajusta el estado del drawer basado en si es móvil o no
    // Solo cambia si el estado actual no coincide con el esperado para el tamaño
    if (isMobile && isDrawerOpen) {
        setIsDrawerOpen(false);
    } else if (!isMobile && !isDrawerOpen) {
        // Considera si quieres que siempre se abra en desktop al cargar
        // setIsDrawerOpen(true); // Descomenta si quieres que siempre se abra en desktop
    }

    // Abre el submenú correspondiente a la ruta actual al cargar/navegar
    const activeSubMenuKey = findActiveSubMenuKey(menuItems, location.pathname);
    if (activeSubMenuKey && !openSubMenus[activeSubMenuKey]) {
      setOpenSubMenus((prev) => ({ ...prev, [activeSubMenuKey]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, location.pathname]); // Dependencias: isMobile y la ruta actual

  // Función para abrir/cerrar el drawer
  const handleDrawerToggle = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  // Función para abrir/cerrar un submenú específico
  const handleSubMenuToggle = useCallback((key: string) => {
    setOpenSubMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Función para cerrar el drawer en móvil al hacer clic en un item
  const handleMenuItemClick = useCallback(() => {
    if (isMobile && isDrawerOpen) {
      setIsDrawerOpen(false);
    }
  }, [isMobile, isDrawerOpen]);

  // Calcula el ancho actual del drawer para el layout principal
  const currentDrawerWidth = isMobile
    ? 0 // En móvil, el drawer es temporal y no ocupa espacio permanente
    : isDrawerOpen
      ? DRAWER_WIDTH
      : COLLAPSED_DRAWER_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />

      {/* AppBar solo para móvil */}
      {isMobile && (
        <MobileAppBar
          onDrawerToggle={handleDrawerToggle}
          title="AEGG APP"
        />
      )}

      {/* Sidebar (Drawer) */}
      <Sidebar
        isMobile={isMobile}
        isDrawerOpen={isDrawerOpen}
        onDrawerToggle={handleDrawerToggle}
        menuItems={menuItems}
        openSubMenus={openSubMenus}
        onSubMenuToggle={handleSubMenuToggle}
        onMenuItemClick={handleMenuItemClick}
        user={user} // Pasa el usuario al Sidebar
      />

      {/* Contenido Principal */}
      <Box
        component="main"
        id="main-content"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 1.5 }, // Reducido de p: 3
          backgroundColor: (theme) =>
            theme.palette.mode === 'light'
              ? theme.palette.grey[50] // Más claro
              : theme.palette.grey[900],
          // Ajusta el ancho restando el ancho del drawer *permanente*
          width: `calc(100% - ${currentDrawerWidth}px)`,
          transition: theme.transitions.create(['width', 'margin'], { // Anima también el margen si es necesario
            easing: theme.transitions.easing.sharp,
            duration: isDrawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
          // Añade margen superior en móvil para compensar el AppBar fijo
          mt: isMobile ? `${theme.mixins.toolbar.minHeight}px` : 0,
          // Asegura que el contenido principal pueda hacer scroll si es necesario
          overflowY: 'auto',
          height: '100vh', // Ocupa toda la altura
          boxSizing: 'border-box', // Incluye padding en el cálculo del tamaño
        }}
      >
        {/* Toolbar fantasma para desktop si no hay AppBar */}
        {/* {!isMobile && <Toolbar />} */} {/* Decide si necesitas este espacio */}
        <Outlet /> {/* Aquí se renderizan las rutas hijas */}
      </Box>
    </Box>
  );
};

export default MainLayout;

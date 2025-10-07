import React from 'react';
import { Drawer, Toolbar, useTheme } from '@mui/material';
import SidebarHeader from './SidebarHeader'; // Importa el nuevo componente
import NavigationMenu from './NavigationMenu'; // Importa el nuevo componente
import UserSpecificMenu from './UserSpecificMenu'; // Importa el nuevo componente
import { CustomMenuItem } from './NavigationMenu'; // O define/importa aquí
import { User } from '../../types/user';

// --- Constantes --- (Puedes moverlas a un archivo de constantes si prefieres)
const DRAWER_WIDTH = 240;
const COLLAPSED_DRAWER_WIDTH = 65;

interface SidebarProps {
  isMobile: boolean;
  isDrawerOpen: boolean;
  onDrawerToggle: () => void;
  menuItems: CustomMenuItem[];
  openSubMenus: Record<string, boolean>;
  onSubMenuToggle: (key: string) => void;
  onMenuItemClick: () => void;
  user: User | null;
}

const Sidebar: React.FC<SidebarProps> = ({
  isMobile,
  isDrawerOpen,
  onDrawerToggle,
  menuItems,
  openSubMenus,
  onSubMenuToggle,
  onMenuItemClick,
  user,
}) => {
  const theme = useTheme();

  const currentDrawerWidth = isMobile
    ? DRAWER_WIDTH
    : isDrawerOpen
      ? DRAWER_WIDTH
      : COLLAPSED_DRAWER_WIDTH;

  const drawerContent = (
    <>
      {/* Cabecera del Drawer */}
      <SidebarHeader
        isDrawerOpen={isDrawerOpen}
        isMobile={isMobile}
        onDrawerToggle={onDrawerToggle}
        title="AEGG APP" // Puedes pasar el título como prop si es dinámico
      />

      {/* Lista principal de navegación */}
      <NavigationMenu
        items={menuItems}
        isDrawerOpen={isDrawerOpen}
        openSubMenus={openSubMenus}
        onSubMenuToggle={onSubMenuToggle}
        onMenuItemClick={onMenuItemClick}
      />

      {/* Sección inferior (Usuarios Condicional y Logout) */}
      <UserSpecificMenu
        user={user}
        isDrawerOpen={isDrawerOpen}
        onMenuItemClick={onMenuItemClick}
      />
    </>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isDrawerOpen}
      onClose={isMobile ? onDrawerToggle : undefined} // onClose solo relevante en móvil
      ModalProps={{
        keepMounted: true, // Better open performance on mobile.
      }}
      sx={{
        width: currentDrawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: isDrawerOpen
            ? theme.transitions.duration.enteringScreen
            : theme.transitions.duration.leavingScreen,
        }),
        '& .MuiDrawer-paper': {
          width: currentDrawerWidth,
          boxSizing: 'border-box',
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: isDrawerOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
          // Asegura que el contenido se distribuya verticalmente
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Añade un Toolbar fantasma en móvil para empujar el contenido hacia abajo */}
      {isMobile && <Toolbar />}
      {drawerContent}
    </Drawer>
  );
};

// Exporta las constantes si las necesitas en MainLayout
export { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH };
export default Sidebar;

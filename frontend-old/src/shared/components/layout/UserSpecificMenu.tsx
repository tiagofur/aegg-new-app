import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import LogoutIcon from '@mui/icons-material/Logout';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../../store'; // Ajusta la ruta
import { logout } from '../../../features/auth/redux/authStateSlice'; // Ajusta la ruta
import { User } from '../../types/user';
import MonthCalendar from '../../../features/calendar/components/MonthCalendar';

interface UserSpecificMenuProps {
  user: User | null; // O el tipo específico de tu usuario
  isDrawerOpen: boolean;
  onMenuItemClick: () => void; // Para cerrar el drawer en móvil
}

const UserSpecificMenu: React.FC<UserSpecificMenuProps> = ({
  user,
  isDrawerOpen,
  onMenuItemClick,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();

  const handleLogout = () => {
    dispatch(logout());
    onMenuItemClick(); // Cierra el drawer si está en móvil
  };

  return (
    <>
      <Divider />
      <Box sx={{ p: 2 }}>
        <MonthCalendar />
      </Box>
      <List sx={{ mt: 'auto' }}>
        {/* Renderizado Condicional para Usuarios */}
        {user?.role === 'ADMIN' && (
          <ListItem key="users-admin" disablePadding sx={{ display: 'block' }}>
            <ListItemButton
              component={NavLink}
              to="/users"
              end
              onClick={onMenuItemClick}
              selected={location.pathname === '/users'}
              sx={{
                minHeight: 48,
                justifyContent: isDrawerOpen ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isDrawerOpen ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                <GroupIcon />
              </ListItemIcon>
              <ListItemText
                primary="Usuarios"
                sx={{ opacity: isDrawerOpen ? 1 : 0 }}
              />
            </ListItemButton>
          </ListItem>
        )}

        {/* Botón de Cerrar Sesión */}
        <ListItem key="logout" disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={handleLogout}
            sx={{
              minHeight: 48,
              justifyContent: isDrawerOpen ? 'initial' : 'center',
              px: 2.5,
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: isDrawerOpen ? 3 : 'auto',
                justifyContent: 'center',
              }}
            >
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Cerrar Sesión"
              sx={{ opacity: isDrawerOpen ? 1 : 0 }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );
};

export default UserSpecificMenu;

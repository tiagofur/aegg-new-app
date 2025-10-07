import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  useTheme,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

// Mantén tu interfaz CustomMenuItem aquí o impórtala
export interface CustomMenuItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
  path?: string;
  children?: CustomMenuItem[];
}

interface NavigationMenuProps {
  items: CustomMenuItem[];
  isDrawerOpen: boolean;
  openSubMenus: Record<string, boolean>;
  onSubMenuToggle: (key: string) => void;
  onMenuItemClick: () => void; // Para cerrar el drawer en móvil
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({
  items,
  isDrawerOpen,
  openSubMenus,
  onSubMenuToggle,
  onMenuItemClick,
}) => {
  const theme = useTheme();
  const location = useLocation();

  const renderMenuItemsRecursive = (
    menuItems: CustomMenuItem[],
    level = 0
  ): React.ReactNode => {
    return menuItems.map((item) => {
      const isActive = item.path ? location.pathname === item.path : false;
      const isSubMenuParentActive = item.children
        ? item.children.some((child) => child.path === location.pathname)
        : false;

      if (item.children && item.children.length > 0) {
        const isSubMenuOpen = openSubMenus[item.key] || false;
        return (
          <React.Fragment key={item.key}>
            <ListItemButton
              onClick={() => onSubMenuToggle(item.key)}
              selected={isSubMenuOpen || isSubMenuParentActive}
              sx={{ pl: level * 2 + 2 }}
            >
              {item.icon && (
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              )}
              <ListItemText
                primary={item.label}
                sx={{
                  opacity: isDrawerOpen ? 1 : 0,
                  transition: theme.transitions.create('opacity', {
                    duration: theme.transitions.duration.shortest,
                  }),
                }}
              />
              {isDrawerOpen &&
                (isSubMenuOpen ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
            <Collapse
              in={isSubMenuOpen && isDrawerOpen}
              timeout="auto"
              unmountOnExit
            >
              <List component="div" disablePadding>
                {renderMenuItemsRecursive(item.children, level + 1)}
              </List>
            </Collapse>
          </React.Fragment>
        );
      }

      return (
        <ListItem key={item.key} disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            component={NavLink}
            to={item.path ?? '#'}
            end // Asegura que solo la ruta exacta esté activa
            onClick={onMenuItemClick}
            selected={isActive}
            sx={{
              minHeight: 48,
              justifyContent: isDrawerOpen ? 'initial' : 'center',
              px: 2.5,
              pl: level * 2 + 2.5, // Indentación basada en el nivel
              ...(!isDrawerOpen && {
                pl: 2.5, // Sin indentación extra si está colapsado
              }),
            }}
          >
            {item.icon && (
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: isDrawerOpen ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIcon>
            )}
            <ListItemText
              primary={item.label}
              sx={{
                opacity: isDrawerOpen ? 1 : 0,
                transition: theme.transitions.create('opacity', {
                  duration: theme.transitions.duration.shortest,
                }),
              }}
            />
          </ListItemButton>
        </ListItem>
      );
    });
  };

  return (
      <List component="nav" sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {renderMenuItemsRecursive(items)}
      </List>
  );
};

export default NavigationMenu;


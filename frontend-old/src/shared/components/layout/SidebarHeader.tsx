import React, { useState } from 'react';
import { Toolbar, IconButton, Typography, Box } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SaveIcon from '@mui/icons-material/Save';
import SyncStatusIndicator from '../SyncStatusIndicator';
import WorkManager from '../WorkManager';

interface SidebarHeaderProps {
  isDrawerOpen: boolean;
  isMobile: boolean;
  onDrawerToggle: () => void;
  title: string;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isDrawerOpen,
  isMobile,
  onDrawerToggle,
  title,
}) => {
  const [workManagerOpen, setWorkManagerOpen] = useState(false);

  const handleWorkManagerOpen = () => {
    setWorkManagerOpen(true);
  };

  const handleWorkManagerClose = () => {
    setWorkManagerOpen(false);
  };

  return (
    <>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isDrawerOpen ? 'space-between' : 'center',
          px: [1],
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          {isDrawerOpen && (
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ color: 'primary.main', fontWeight: 600, mr: 1 }}
            >
              {title}
            </Typography>
          )}

          {/* Indicador de sincronización - siempre visible */}
          <SyncStatusIndicator />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Botón para gestionar trabajos - solo cuando el drawer está abierto */}
          {isDrawerOpen && (
            <IconButton
              onClick={handleWorkManagerOpen}
              aria-label="Gestionar trabajos"
              sx={{ color: 'primary.main', mr: 1 }}
              size="small"
            >
              <SaveIcon />
            </IconButton>
          )}

          {/* Solo mostrar botón de colapsar/expandir en desktop */}
          {!isMobile && (
            <IconButton
              onClick={onDrawerToggle}
              aria-label={isDrawerOpen ? 'Colapsar menú' : 'Expandir menú'}
              sx={{ color: 'primary.main' }}
            >
              {isDrawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          )}
        </Box>
      </Toolbar>

      {/* WorkManager Dialog */}
      <WorkManager open={workManagerOpen} onClose={handleWorkManagerClose} />
    </>
  );
};

export default SidebarHeader;

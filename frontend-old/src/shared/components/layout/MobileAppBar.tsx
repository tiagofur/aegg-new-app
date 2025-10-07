import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import WorkIcon from '@mui/icons-material/Work';
import SyncStatusIndicator from '../SyncStatusIndicator';
import WorkManager from '../WorkManager';

interface MobileAppBarProps {
  onDrawerToggle: () => void;
  title: string;
}

const MobileAppBar: React.FC<MobileAppBarProps> = ({ onDrawerToggle, title }) => {
  const [workManagerOpen, setWorkManagerOpen] = useState(false);

  return (
    <>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, flexGrow: 1 }}>
            {title}
          </Typography>

          <Box display="flex" alignItems="center" gap={1}>
            {/* Indicador de sincronización */}
            <SyncStatusIndicator compact showDetails={false} />

            {/* Botón para WorkManager */}
            <IconButton
              color="inherit"
              onClick={() => setWorkManagerOpen(true)}
              title="Mis Trabajos"
            >
              <WorkIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* WorkManager Dialog */}
      <WorkManager
        open={workManagerOpen}
        onClose={() => setWorkManagerOpen(false)}
        onLoadWork={(work) => {
          console.log('Cargando trabajo:', work);
          // TODO: Implementar carga del trabajo en el estado de la aplicación
        }}
        currentWorkData={{
          name: 'Trabajo Actual', // TODO: Obtener del estado actual
          description: 'Estado actual del reporte',
        }}
      />
    </>
  );
};

export default MobileAppBar;

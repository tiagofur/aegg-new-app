// src/features/users/components/AccessDeniedMessage.tsx
import React from 'react';
import { Box, Alert, Typography } from '@mui/material';
import BlockIcon from '@mui/icons-material/Block';

const AccessDeniedMessage: React.FC = () => {
  return (
    <Box sx={{ mt: 4, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <BlockIcon color="error" sx={{ fontSize: '4rem' }} />
      <Alert severity="error" icon={false} sx={{ width: '100%', justifyContent: 'center' }}>
        <Typography variant="h6" component="div" align="center">Acceso Denegado</Typography>
        <Typography align="center">No tienes los permisos necesarios para administrar usuarios.</Typography>
      </Alert>
    </Box>
  );
};

export default AccessDeniedMessage;

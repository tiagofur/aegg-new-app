// src/features/users/components/UsersPageHeader.tsx
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

interface UsersPageHeaderProps {
  onCreateUserClick: () => void;
}

const UsersPageHeader: React.FC<UsersPageHeaderProps> = ({ onCreateUserClick }) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        sx={{ textAlign: { xs: 'center', sm: 'left' }, flexGrow: 1 }}
      >
        Administrar Usuarios
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={onCreateUserClick}
        sx={{ ml: { sm: 2 } }}
      >
        Crear Usuario
      </Button>
    </Box>
  );
};

export default UsersPageHeader;

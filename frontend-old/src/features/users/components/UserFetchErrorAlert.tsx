// src/features/users/components/UserFetchErrorAlert.tsx
import React from 'react';
import { Alert, Button } from '@mui/material';

interface UserFetchErrorAlertProps {
  error: string | null;
  onRetry: () => void;
}

const UserFetchErrorAlert: React.FC<UserFetchErrorAlertProps> = ({ error, onRetry }) => {
  if (!error) return null;

  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      Error al cargar usuarios: {error}
      <Button onClick={onRetry} sx={{ ml: 2 }}>
        Reintentar
      </Button>
    </Alert>
  );
};

export default UserFetchErrorAlert;

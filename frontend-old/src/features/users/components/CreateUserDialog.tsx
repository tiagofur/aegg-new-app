// src/features/users/components/CreateUserDialog.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import CreateUserForm from './CreateUserForm'; // Asegúrate que la ruta es correcta

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Crear Usuario</DialogTitle>
      <DialogContent>
        {/* Pasar onClose para que el formulario pueda cerrar el diálogo */}
        <CreateUserForm onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
};

export default CreateUserDialog;

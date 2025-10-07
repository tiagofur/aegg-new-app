// src/features/users/components/EditUserDialog.tsx
import React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import EditUserForm from './EditUserForm'; // Asegúrate que la ruta es correcta
import { User } from '../pages/UsersPage'; // O importa desde donde definas User globalmente

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, user, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Usuario</DialogTitle>
      <DialogContent>
        {/* Asegurarse que user existe antes de renderizar el formulario */}
        {user && (
          <EditUserForm user={user} onClose={onClose} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditUserDialog;

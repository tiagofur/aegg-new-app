// src/features/users/components/EditUserForm.tsx
import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  CircularProgress,
  // Quita Alert si ya no se usa para otros errores
} from "@mui/material";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import { updateUser } from "../redux/usersUpdateSlice";
import { User } from "../../../shared/types/user";
import { fetchUsers } from "../redux/usersFetchSlice";
// 1. Importa showNotification
import { showNotification } from "../../../shared/redux/notificationSlice";

interface EditUserFormProps {
  user: User;
  onClose: () => void;
}

const EditUserForm: React.FC<EditUserFormProps> = ({ user, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<"ADMIN" | "USER">(user.role);
  const [isSaving, setIsSaving] = useState(false);
  // 2. Quita el estado de error local
  // const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // setError(null); // Ya no es necesario
    setIsSaving(true);

    const updatedUserData = {
      id: user.id,
      name: name,
      email: email,
      role: role,
    };

    try {
      await dispatch(updateUser(updatedUserData)).unwrap();
      // 3. Notificación de éxito
      dispatch(showNotification({ message: `Usuario '${name}' actualizado correctamente.`, severity: 'success' }));
      await dispatch(fetchUsers());
      onClose();
    } catch (err: any) {
      // 4. Notificación de error
      const errorMessage = err?.message || "Ocurrió un error al guardar los cambios.";
      dispatch(showNotification({ message: errorMessage, severity: 'error' }));
      // setError(errorMessage); // Ya no es necesario
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, minWidth: 350 }}>
      {/* 5. Quita el Alert de error local */}
      {/* {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )} */}
      <TextField
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        margin="normal"
        disabled={isSaving}
      />
      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
        disabled={isSaving}
      />
      <FormControl fullWidth margin="normal" disabled={isSaving}>
        <InputLabel id="role-label">Rol</InputLabel>
        <Select
          labelId="role-label"
          value={role}
          label="Rol"
          onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
        >
          <MenuItem value="ADMIN">ADMIN</MenuItem>
          <MenuItem value="USER">USER</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isSaving || !name || !email}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
    </Box>
  );
};

export default EditUserForm;

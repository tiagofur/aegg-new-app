import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/index";
import { createUser } from "../redux/usersCreateSlice";
import { fetchUsers } from "../redux/usersFetchSlice";
import { showNotification } from "../../../shared/redux/notificationSlice";
import { TextField, Button, Box } from "@mui/material";

export interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
}

interface CreateUserFormProps {
  onClose: () => void;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      dispatch(showNotification({ message: "Todos los campos son obligatorios.", severity: 'warning' }));
      return;
    }
    setIsSubmitting(true);

    try {
      await dispatch(createUser(formData)).unwrap();

      dispatch(showNotification({ message: `Usuario '${formData.name}' creado correctamente.`, severity: 'success' }));
      dispatch(fetchUsers());
      onClose();

    } catch (err: any) {
      const errorMessage = err?.message || "Ocurrió un error al crear el usuario.";
      dispatch(showNotification({ message: errorMessage, severity: 'error' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSubmit();
  };

  return (
    <Box
      component="form"
      onSubmit={handleFormSubmit}
      sx={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 350 }}
    >
      <TextField
        label="Nombre"
        name="name"
        value={formData.name}
        onChange={handleTextFieldChange}
        fullWidth
        required
        aria-label="Nombre"
        disabled={isSubmitting}
      />
      <TextField
        label="Email"
        name="email"
        value={formData.email}
        onChange={handleTextFieldChange}
        fullWidth
        required
        type="email"
        aria-label="Email"
        disabled={isSubmitting}
      />
      <TextField
        label="Contraseña"
        name="password"
        value={formData.password}
        onChange={handleTextFieldChange}
        fullWidth
        required
        type="password"
        aria-label="Contraseña"
        disabled={isSubmitting}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isSubmitting || !formData.name || !formData.email || !formData.password}
        >
          {isSubmitting ? "Creando..." : "Crear"}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateUserForm;


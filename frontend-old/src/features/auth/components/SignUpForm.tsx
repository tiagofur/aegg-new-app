// src/components/auth/SignUpForm.tsx
import React, { useState } from "react";
import {
    Box,
    TextField,
    Button,
    CircularProgress,
    Typography,
} from "@mui/material";

// Interfaz para los datos del formulario de registro
export interface SignUpFormData {
    name: string;
    email: string;
    password: string;
    // Podrías añadir confirmPassword si necesitas validación en el frontend
    // confirmPassword?: string;
}

// Interfaz para las props del componente
interface SignUpFormProps {
    /**
     * Función que se ejecuta al enviar el formulario.
     * Debería disparar la acción de registro (signup).
     */
    onSubmit: (data: SignUpFormData) => void;
    /** Indica si la operación de registro está en curso. */
    isLoading: boolean;
    /** Mensaje de error a mostrar, si existe. */
    error: string | null;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit, isLoading, error }) => {
    // Estado local para los campos del formulario
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // const [confirmPassword, setConfirmPassword] = useState(""); // Descomentar si se usa

    // Manejador del envío del formulario
    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        // Aquí podrías añadir validación local si lo deseas (ej: password === confirmPassword)
        onSubmit({ name, email, password });
    };

    return (
        <Box
            component="form"
            noValidate
            onSubmit={handleSubmit}
            sx={{ width: '100%' }}
        >
            <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Nombre Completo"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                autoComplete="name"
                autoFocus // Pone el foco en este campo al cargar
                sx={{ mb: 2 }}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Correo Electrónico"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="email"
                sx={{ mb: 2 }}
            />
            <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Contraseña"
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="new-password" // Importante para registro
                sx={{ mb: 2 }}
            />
            {/* Campo opcional para confirmar contraseña
      <TextField
        margin="normal"
        required
        fullWidth
        name="confirmPassword"
        label="Confirmar Contraseña"
        type="password"
        id="confirmPassword"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={isLoading}
        autoComplete="new-password"
        sx={{ mb: 2 }}
      />
      */}

            {/* Muestra el mensaje de error si existe */}
            {error && (
                <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                    {error}
                </Typography>
            )}

            <Button
                type="submit"
                variant="contained"
                color="primary" // O podrías usar 'secondary' para diferenciar de login
                fullWidth
                disabled={isLoading}
                sx={{
                    py: 1.5,
                    fontWeight: "bold",
                    mt: 2, // Margen superior antes del botón
                }}
                startIcon={
                    isLoading ? <CircularProgress size={20} color="inherit" /> : null
                }
            >
                {isLoading ? "Registrando..." : "Registrarse"}
            </Button>
        </Box>
    );
};

export default SignUpForm;

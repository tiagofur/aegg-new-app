// src/pages/auth/SignUpPage.tsx
import React, { useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom"; // Importa Link para ir a Login
import { useDispatch, useSelector } from "react-redux";
import SignUpForm, { SignUpFormData } from "../components/SignUpForm"; // Importa el nuevo form
import { resetSignUpState, signUpUser } from "../redux/authSignUpSlice"; // Necesitarás crear signUpUser y resetSignUpState
import { RootState, AppDispatch } from "../../../store/index";
import {
    Card,
    Grid,
    Box,
    Typography,
    Container,
    CssBaseline,
    Link, // Importa Link de MUI
} from "@mui/material";

const SignUpPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    // Asumiendo que tienes estados separados para signup en Redux
    const { isSignUpLoading, signUpError, signUpSuccess } = useSelector(
        (state: RootState) => state.authSignUp
    );
    const navigate = useNavigate();

    // Efecto para redirigir después de un registro exitoso
    useEffect(() => {
        if (signUpSuccess) {
            // Opcional: Mostrar un mensaje de éxito antes de redirigir
            // alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
            dispatch(resetSignUpState()); // Limpia el estado de signup
            navigate("/login"); // Redirige a la página de login
        }
        // Limpia el estado si el usuario desmonta el componente (navega a otro sitio)
        return () => {
            dispatch(resetSignUpState());
        };
    }, [signUpSuccess, navigate, dispatch]);

    // Función que se pasa al SignUpForm
    const handleSignUp = (data: SignUpFormData) => {
        dispatch(signUpUser(data)); // Despacha la acción de registro
    };

    return (
        <>
            <CssBaseline />
            <Container
                component="main"
                maxWidth={false}
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    bgcolor: "#f0f2f5",
                    p: 2,
                }}
            >
                <Card
                    sx={{
                        display: "flex",
                        maxWidth: "900px", // Mismo ancho que login
                        width: "100%",
                        minHeight: { xs: "auto", md: 500 }, // Mismo alto que login
                        borderRadius: 5,
                        boxShadow: 5,
                        overflow: "hidden",
                    }}
                >
                    <Grid container>
                        {/* Sección Izquierda (Puedes cambiar el contenido) */}
                        <Grid container size={{ xs: 12, md: 6 }}>
                            <Box
                                sx={{
                                    bgcolor: "primary.main",
                                    color: "common.white",
                                    height: "100%",
                                    width: "100%",
                                    p: { xs: 3, md: 4 },
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography variant="h4" component="h2" gutterBottom>
                                    Únete a Nosotros
                                </Typography>
                                <Typography variant="body1">
                                    Crea tu cuenta para empezar a gestionar tus datos.
                                </Typography>
                                {/* Podrías añadir una imagen aquí también */}
                            </Box>
                        </Grid>

                        {/* Sección Derecha (Formulario de Registro) */}
                        <Grid container size={{ xs: 12, md: 6 }}>
                            <Box
                                sx={{
                                    bgcolor: "background.paper",
                                    height: "100%",
                                    width: "100%",
                                    p: { xs: 3, md: 4 },
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: 'center',
                                }}
                            >
                                <Typography
                                    variant="h5"
                                    component="h1"
                                    gutterBottom
                                    sx={{
                                        color: 'primary.main', // O secondary.main
                                        fontWeight: 'bold',
                                        mb: 3,
                                        textAlign: 'center'
                                    }}
                                >
                                    Crear Cuenta
                                </Typography>
                                <SignUpForm
                                    onSubmit={handleSignUp}
                                    isLoading={isSignUpLoading} // Usa el estado de carga de signup
                                    error={signUpError}       // Usa el estado de error de signup
                                />
                                {/* Enlace para ir a la página de Login */}
                                <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
                                    ¿Ya tienes una cuenta?{' '}
                                    <Link component={RouterLink} to="/login" variant="body2">
                                        Inicia sesión aquí
                                    </Link>
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Card>
            </Container>
        </>
    );
};

export default SignUpPage;

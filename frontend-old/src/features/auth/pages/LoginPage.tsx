// src/features/auth/pages/LoginPage.tsx
import React from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom'; // Añadir useLocation
import { useDispatch, useSelector } from 'react-redux';
import LoginForm, { LoginFormData } from '../components/LoginForm'; // Importar también LoginFormData si está ahí
import { loginUser } from '../redux/authLoginSlice';
import { setAuthState } from '../redux/authStateSlice'; // <--- Importar setAuthState
import { RootState, AppDispatch } from '../../../store/index';
import {
  Card,
  Grid,
  Box,
  Typography,
  Container,
  CssBaseline,
  Link,
  Alert, // Importar Alert para mostrar errores de forma más clara
} from '@mui/material';

const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation(); // Para obtener la ruta de origen si viene de una redirección

  // Seleccionar solo los estados relevantes para el PROCESO de login desde authLoginSlice
  const { isLoginLoading, loginError } = useSelector((state: RootState) => state.authLogin);

  // Ya no necesitamos el useEffect para redirigir si ya hay token,
  // PublicRoute en App.tsx se encarga de eso.

  const handleLogin = async (data: LoginFormData) => {
    try {
      // Despacha el thunk de login y espera el resultado usando unwrap()
      // unwrap() devolverá el payload de 'fulfilled' o lanzará el error de 'rejected'
      const resultAction = await dispatch(loginUser(data)).unwrap();

      // Si llegamos aquí, el login fue exitoso (no se lanzó error)
      // resultAction contiene { user: User, accessToken: string }
      dispatch(
        setAuthState({
          user: resultAction.user,
          token: resultAction.accessToken,
        })
      );

      // Navegar a la página de origen o al dashboard/home
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (error) {
      // El error ya fue establecido en loginError por el extraReducer 'rejected'
      // Podemos mostrar un mensaje genérico o confiar en el error mostrado por el LoginForm
      console.error('Login failed:', error);
      // Opcional: Mostrar un Snackbar/Toast de error aquí
    }
  };

  return (
    <>
      <CssBaseline />
      <Container
        component="main"
        maxWidth={false}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: '#f0f2f5',
          p: 2,
        }}
      >
        <Card
          sx={{
            display: 'flex',
            maxWidth: '900px',
            width: '100%',
            minHeight: { xs: 'auto', md: 500 },
            borderRadius: 5,
            boxShadow: 5,
            overflow: 'hidden',
          }}
        >
          <Grid container>
            {/* Sección Izquierda */}
            <Grid container size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'common.white',
                  height: '100%',
                  width: '100%',
                  p: { xs: 3, md: 4 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}
              >
                <Typography variant="h4" component="h2" gutterBottom>
                  Bienvenido de Nuevo
                </Typography>
                <Typography variant="body1">Inicia sesión para acceder a tu cuenta.</Typography>
                {/* Puedes añadir un logo o imagen aquí */}
              </Box>
            </Grid>

            {/* Sección Derecha (Formulario) */}
            <Grid container size={{ xs: 12, md: 6 }}>
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  height: '100%',
                  width: '100%',
                  p: { xs: 3, md: 4 },
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="h5"
                  component="h1"
                  gutterBottom
                  sx={{
                    color: 'primary.main',
                    fontWeight: 'bold',
                    mb: 3,
                    textAlign: 'center',
                  }}
                >
                  Iniciar Sesión
                </Typography>
                {/* Mostrar error global si existe y no se maneja dentro del form */}
                {loginError && !isLoginLoading && (
                  <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                    {loginError}
                  </Alert>
                )}
                <LoginForm onSubmit={handleLogin} isLoading={isLoginLoading} error={null} />
                <Typography variant="body2" sx={{ mt: 3, textAlign: 'center' }}>
                  ¿No tienes una cuenta?{' '}
                  <Link component={RouterLink} to="/signup" variant="body2">
                    Regístrate aquí
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

export default LoginPage;

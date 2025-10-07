// /Users/tiago/Desktop/creapolis/foofie_nuevo/AEGG/src/context/AuthContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User } from '../shared/types/user'; // Asegúrate que la ruta sea correcta

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Es buena práctica inicializar el contexto con valores por defecto que coincidan con la interfaz
// aunque aquí usamos 'undefined' y el check en useAuth es la forma común.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // ***** CORRECCIÓN AQUÍ: Inicializa explícitamente los estados *****
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    // Intenta cargar el usuario desde localStorage al inicio
    const storedUserData = localStorage.getItem('userData');
    try {
      return storedUserData ? JSON.parse(storedUserData) : null;
    } catch (error) {
      console.error("Error parsing stored user data:", error);
      localStorage.removeItem('userData'); // Limpia si está corrupto
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Comprueba si existe un token al inicio
    const token = localStorage.getItem('authToken');
    return !!token; // Convierte la presencia del token a booleano
  });

  // Efecto para actualizar isAuthenticated si currentUser cambia (ej. al hacer login)
  // O si el token se elimina externamente (menos común)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    // Es más robusto basar isAuthenticated directamente en la presencia del token
    // y/o la validez del currentUser si haces una verificación más profunda.
    // Aquí lo simplificamos: si hay token Y usuario, está autenticado.
    // O simplemente, si hay token. Depende de tu lógica.
    setIsAuthenticated(!!token && !!currentUser);

    // Listener opcional para cambios en localStorage desde otras pestañas
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'authToken' || event.key === 'userData') {
            const currentToken = localStorage.getItem('authToken');
            const currentUserData = localStorage.getItem('userData');
            setCurrentUser(currentUserData ? JSON.parse(currentUserData) : null);
            setIsAuthenticated(!!currentToken);
        }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };

  }, [currentUser]); // Depende de currentUser para re-evaluar tras login/logout

  const handleLoginSuccess = (user: User, token: string) => {
    try {
        localStorage.setItem('userData', JSON.stringify(user));
        localStorage.setItem('authToken', token);
        setCurrentUser(user);
        setIsAuthenticated(true); // Actualiza inmediatamente tras login
    } catch (error) {
        console.error("Error saving data to localStorage:", error);
        // Podrías manejar el error de alguna forma (ej. mostrar notificación)
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    setCurrentUser(null);
    setIsAuthenticated(false); // Actualiza inmediatamente tras logout
  };

  // El objeto 'value' ahora coincide con AuthContextType porque
  // los estados se inicializaron correctamente.
  const value = {
    currentUser,
    isAuthenticated,
    login: handleLoginSuccess,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook personalizado para usar el contexto fácilmente
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // Este error es correcto, asegura que el hook se usa dentro del Provider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

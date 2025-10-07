// src/features/auth/types/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER"; // Cambia esto según los roles que manejes
  // Puedes añadir más campos si tu API los devuelve (roles, etc.)
}

export interface UserWithId {
  id: string; // Usaremos 'id' internamente
  name: string;
  email: string;
  role: "ADMIN" | "USER";
}

// También puedes definir el tipo de la respuesta completa del login
export interface LoginResponse {
  accessToken: string;
  user: User;
}

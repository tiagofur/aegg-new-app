# 🚀 Aplicación Full Stack - GUÍA DE INICIO RÁPIDO

## ✅ Estado Actual: ¡TODO FUNCIONANDO!

La aplicación está completamente configurada y corriendo. Acabas de crear una aplicación full stack moderna con:

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: NestJS + PostgreSQL + TypeORM
- **Auth**: Login y Register con JWT
- **Docker**: Todo containerizado y listo para usar

## 🌐 Accede a tu aplicación

### Frontend (React)

**URL**: http://localhost:5173

Abre tu navegador y visita esta URL para ver la aplicación funcionando.

### Backend API (NestJS)

**URL**: http://localhost:3001

Endpoints disponibles:

- `POST http://localhost:3001/auth/register` - Crear cuenta
- `POST http://localhost:3001/auth/login` - Iniciar sesión

### Base de Datos (PostgreSQL)

**Puerto**: 5432

- Usuario: `postgres`
- Contraseña: `postgres`
- Base de datos: `appdb`

## 📊 Estado de los Servicios

Verifica que todo esté corriendo:

```bash
docker-compose ps
```

Deberías ver 3 contenedores UP:

- ✅ `postgres_db` - Base de datos PostgreSQL
- ✅ `nestjs_backend` - API Backend (puerto 3001)
- ✅ `react_frontend` - Aplicación React (puerto 5173)

## 🎯 Prueba la Aplicación

### 1. Abre el navegador

```
http://localhost:5173
```

### 2. Crea una cuenta

- Haz clic en "Regístrate"
- Ingresa tu nombre, email y contraseña
- Haz clic en "Registrarse"

### 3. Inicia sesión

- Usa tu email y contraseña
- Verás el Dashboard de bienvenida

## 🛠️ Comandos Útiles

### Ver logs en tiempo real

```bash
docker-compose logs -f
```

### Ver logs solo del backend

```bash
docker-compose logs -f backend
```

### Ver logs solo del frontend

```bash
docker-compose logs -f frontend
```

### Detener la aplicación

```bash
docker-compose down
```

### Iniciar la aplicación nuevamente

```bash
docker-compose up -d
```

### Reiniciar todo (eliminar datos)

```bash
docker-compose down -v
docker-compose up -d
```

## 📁 Estructura del Proyecto

```
new-app/
├── frontend/                   # Aplicación React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   ├── context/           # Context API (AuthContext)
│   │   ├── pages/             # Login, Register, Dashboard
│   │   ├── services/          # API calls (axios)
│   │   └── App.tsx
│   ├── .env                   # Variables de entorno
│   └── package.json
│
├── backend/                   # API NestJS
│   ├── src/
│   │   ├── auth/             # Módulo de autenticación
│   │   │   ├── dto/          # Validación de datos
│   │   │   ├── entities/     # User entity (TypeORM)
│   │   │   ├── guards/       # JWT Guard
│   │   │   └── strategies/   # JWT Strategy
│   │   ├── app.module.ts     # Módulo principal
│   │   └── main.ts
│   ├── .env                  # Variables de entorno
│   └── package.json
│
├── docker-compose.yml        # Orquestación de servicios
└── README-START.md          # Este archivo
```

## 🔐 Sistema de Autenticación

### Flujo de Registro

1. El usuario completa el formulario de registro
2. El backend valida los datos
3. La contraseña se hashea con bcrypt
4. Se crea el usuario en PostgreSQL
5. Se genera un JWT token
6. El token se guarda en localStorage
7. El usuario es redirigido al Dashboard

### Flujo de Login

1. El usuario ingresa email y contraseña
2. El backend verifica las credenciales
3. Se genera un JWT token
4. El token se guarda en localStorage
5. El usuario es redirigido al Dashboard

### Rutas Protegidas

- El Dashboard está protegido
- Si no hay token válido, redirige a Login
- El token expira en 7 días

## 🎨 Personalización del Diseño

La aplicación usa **Tailwind CSS** con un diseño minimalista moderno.

### Colores principales

- Primario: Azul (`blue-600`)
- Fondo: Gris claro con gradientes
- Texto: Gris oscuro

### Archivos de estilo

- `frontend/src/index.css` - Estilos globales y Tailwind
- `frontend/tailwind.config.js` - Configuración de Tailwind

## 🔧 Desarrollo Local (sin Docker)

Si prefieres trabajar sin Docker:

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

**Nota**: Necesitarás PostgreSQL corriendo localmente en el puerto 5432.

## 📝 Próximos Pasos

Ahora que tienes Login y Register funcionando, puedes agregar:

### Funcionalidades de Usuario

- [ ] Editar perfil de usuario
- [ ] Cambiar contraseña
- [ ] Recuperación de contraseña por email
- [ ] Avatar de usuario
- [ ] Verificación de email

### Funcionalidades de la Aplicación

- [ ] CRUD de recursos (tareas, notas, etc.)
- [ ] Roles y permisos
- [ ] Notificaciones
- [ ] Búsqueda y filtros
- [ ] Paginación

### Mejoras Técnicas

- [ ] Tests unitarios (Jest)
- [ ] Tests E2E (Cypress)
- [ ] Validación más robusta
- [ ] Rate limiting
- [ ] Logger mejorado
- [ ] Documentación API (Swagger)

## 🐛 Solución de Problemas

### La aplicación no carga

```bash
# Verifica que Docker esté corriendo
docker ps

# Reinicia los servicios
docker-compose restart
```

### Error de conexión a la base de datos

```bash
# Verifica logs de PostgreSQL
docker-compose logs postgres

# Recrea el contenedor
docker-compose down
docker-compose up -d
```

### El frontend no se conecta al backend

```bash
# Verifica la variable de entorno
cat frontend/.env

# Debe decir: VITE_API_URL=http://localhost:3001
```

### Los cambios no se reflejan

```bash
# Los volúmenes de Docker sincronizan automáticamente
# Si no funciona, reinicia:
docker-compose restart backend
docker-compose restart frontend
```

## 📚 Recursos y Documentación

### Tecnologías Usadas

- [React](https://react.dev/) - Librería UI
- [Vite](https://vitejs.dev/) - Build tool
- [NestJS](https://nestjs.com/) - Framework backend
- [TypeORM](https://typeorm.io/) - ORM para PostgreSQL
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS
- [Docker](https://www.docker.com/) - Containerización

### Tutoriales Recomendados

- [React Router](https://reactrouter.com/) - Para más rutas
- [React Hook Form](https://react-hook-form.com/) - Formularios avanzados
- [NestJS Authentication](https://docs.nestjs.com/security/authentication)

## 🎉 ¡Felicidades!

Tienes una aplicación full stack completamente funcional con autenticación, diseño moderno y dockerizada.

**¡Ahora a construir algo increíble! 🚀**

---

## 📞 Necesitas Ayuda?

Si algo no funciona:

1. Verifica los logs: `docker-compose logs -f`
2. Verifica el estado: `docker-compose ps`
3. Reinicia: `docker-compose restart`
4. Como último recurso: `docker-compose down -v && docker-compose up -d`

---

**Creado con ❤️ usando React, NestJS y PostgreSQL**

# Aplicación Full Stack - React + NestJS + PostgreSQL

## 🚀 Stack Tecnológico

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: NestJS + TypeORM + PostgreSQL
- **Autenticación**: JWT (JSON Web Tokens)
- **Containerización**: Docker + Docker Compose

## 📋 Características

✅ Sistema de autenticación completo (Login/Register)
✅ Diseño minimalista y moderno con Tailwind CSS
✅ Configuración Docker lista para desarrollo
✅ API REST con validación de datos
✅ TypeScript en frontend y backend
✅ PostgreSQL como base de datos

## 🛠️ Requisitos Previos

- [Docker](https://www.docker.com/get-started) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado
- Node.js 20+ (opcional, para desarrollo local sin Docker)

## 🚀 Inicio Rápido con Docker

### 1. Clonar el repositorio y navegar al directorio

```bash
cd new-app
```

### 2. Iniciar todos los servicios con Docker Compose

```bash
docker-compose up --build
```

Esto iniciará:

- **PostgreSQL** en el puerto `5432`
- **Backend (NestJS)** en el puerto `3000`
- **Frontend (React)** en el puerto `5173`

### 3. Acceder a la aplicación

Abre tu navegador en: **http://localhost:5173**

## 🔧 Desarrollo Local (sin Docker)

### Backend

```bash
cd backend
npm install
npm run start:dev
```

El backend estará disponible en `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible en `http://localhost:5173`

### Base de Datos

Asegúrate de tener PostgreSQL corriendo localmente con estas credenciales:

- Host: `localhost`
- Puerto: `5432`
- Usuario: `postgres`
- Contraseña: `postgres`
- Base de datos: `appdb`

## 📁 Estructura del Proyecto

```
new-app/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── auth/        # Módulo de autenticación
│   │   │   ├── dto/     # Data Transfer Objects
│   │   │   ├── entities/    # Entidades TypeORM
│   │   │   ├── guards/      # Guards de autenticación
│   │   │   └── strategies/  # Estrategias JWT
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── Dockerfile
│   └── package.json
│
├── frontend/            # App React + Vite
│   ├── src/
│   │   ├── components/  # Componentes reutilizables
│   │   ├── context/     # Context API (Auth)
│   │   ├── pages/       # Páginas (Login, Register, Dashboard)
│   │   ├── services/    # API calls
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
│
└── docker-compose.yml   # Orquestación de servicios
```

## 🔐 Autenticación

La aplicación utiliza JWT para autenticación:

1. **Register**: Crea una cuenta con email, nombre y contraseña
2. **Login**: Inicia sesión con email y contraseña
3. El token se guarda en `localStorage`
4. Rutas protegidas requieren autenticación

### Endpoints API

- `POST /auth/register` - Crear cuenta
- `POST /auth/login` - Iniciar sesión

## 🎨 Diseño

El diseño utiliza Tailwind CSS con un enfoque minimalista y moderno:

- Colores neutros con acentos azules
- Esquemas de gradientes sutiles
- Animaciones y transiciones suaves
- Diseño responsive

## 📝 Variables de Entorno

### Backend (.env)

```env
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=appdb
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000
```

## 🐳 Comandos Docker Útiles

```bash
# Iniciar servicios
docker-compose up

# Iniciar en segundo plano
docker-compose up -d

# Reconstruir imágenes
docker-compose up --build

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 🔄 Próximos Pasos

Ahora que tienes login y register funcionando, puedes agregar:

- [ ] Recuperación de contraseña
- [ ] Perfil de usuario editable
- [ ] Roles y permisos
- [ ] Más páginas y funcionalidades
- [ ] Tests unitarios e integración
- [ ] CI/CD pipeline

## 🐛 Troubleshooting

### El backend no se conecta a la base de datos

Asegúrate de que PostgreSQL esté corriendo y las credenciales sean correctas.

### Error de CORS

Verifica que la URL del backend esté correctamente configurada en `VITE_API_URL`.

### Los cambios no se reflejan

Si estás usando Docker, los volúmenes deberían sincronizar automáticamente. Si no, intenta reconstruir:

```bash
docker-compose down
docker-compose up --build
```

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

**¡Listo para desarrollar! 🎉**

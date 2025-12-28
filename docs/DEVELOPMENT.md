# 💻 Guía de Desarrollo

**Última actualización**: 27/12/2025

## 📋 Índice

1. [🖥️ Setup Inicial](#setup-inicial)
2. [🔧 Entorno de Desarrollo](#entorno-de-desarrollo)
3. [📦 Estructura del Proyecto](#estructura-del-proyecto)
4. [🧪 Comandos de Desarrollo](#comandos-de-desarrollo)
5. [🔐 Autenticación](#autenticación)
6. [📊 Database](#database)
7. [🧪 Tests](#tests)
8. [📖 Conveniones de Código](#conveniones-de-código)
9. [🐛 Debugging](#debugging)
10. [🚀 Pull Requests](#pull-requests)

---

## 🖥️ Setup Inicial

### Requisitos

- **Node.js**: 18+
- **npm**: 9+
- **Docker**: 20.10+
- **Git**: 2.30+

### Clonar e Inicializar

```bash
# 1. Clonar repositorio
git clone https://github.com/tiagofur/aegg-new-app.git
cd aegg-new-app

# 2. Iniciar Docker services
docker-compose up -d

# 3. Verificar que todo está corriendo
docker ps
# Deberías ver: postgres, pgadmin

# 4. Instalar dependencias backend
cd backend
npm install

# 5. Instalar dependencias frontend
cd ../frontend
npm install

# 6. Iniciar en modo desarrollo
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Verificar Setup

```bash
# Backend: http://localhost:3000
curl http://localhost:3000/health

# Frontend: http://localhost:5173
# Abre navegador a http://localhost:5173

# PostgreSQL: localhost:5440
docker exec aegg-postgres pg_isready -U postgres -d appdb
```

---

## 🔧 Entorno de Desarrollo

### Backend (NestJS)

```bash
cd backend

# Development con hot reload
npm run start:dev

# Debug mode
npm run start:debug

# Production mode (build)
npm run build
npm run start:prod
```

### Frontend (React + Vite)

```bash
cd frontend

# Development con hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Type checking
npm run typecheck
```

### Comandos Comunes

```bash
# Backend
npm test                    # Ejecutar tests
npm run lint              # Linting
npm run format             # Formatting con Prettier

# Frontend
npm test                    # Ejecutar tests
npm run lint              # Linting
npm run format             # Formatting con Prettier
```

---

## 📦 Estructura del Proyecto

```
aegg-new-app/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/             # Autenticación JWT
│   │   ├── clientes/         # Gestión de clientes
│   │   ├── trabajos/         # Sistema de trabajos contables
│   │   ├── users/            # Gestión de usuarios
│   │   ├── knowledge-base/   # Base de conocimiento
│   │   ├── common/           # Helpers y utilidades
│   │   ├── migrations/       # Migraciones de DB
│   │   └── types/           # Tipos TypeScript globales
│   ├── test/                 # Tests del backend
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── .env                  # Variables de entorno (NO commitear)
│
├── frontend/                   # React + TypeScript
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── features/         # Funcionalidades por feature
│   │   │   ├── trabajos/    # Módulo de trabajos
│   │   │   ├── clientes/    # Módulo de clientes
│   │   │   └── aprobaciones/ # Módulo de aprobaciones
│   │   ├── pages/            # Páginas de la app
│   │   ├── services/         # API clients
│   │   ├── types/           # Tipos TypeScript
│   │   └── context/         # Context API (Auth)
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── .env                  # Variables de entorno (NO commitear)
│
├── docs/                       # Documentación
├── .github/
│   └── workflows/            # GitHub Actions
├── docker-compose.yml          # PostgreSQL + pgAdmin
├── ecosystem.config.js        # PM2 configuration
└── README.md
```

---

## 🧪 Comandos de Desarrollo

### Git Workflow

```bash
# 1. Crear branch para feature
git checkout -b feat/nueva-funcionalidad

# 2. Hacer commits frecuentes
git add .
git commit -m "feat: agregar funcionalidad X"

# 3. Hacer push
git push origin feat/nueva-funcionalidad

# 4. Pull request a main
# Desde GitHub UI

# 5. Después de merge
git checkout main
git pull
git branch -d feat/nueva-funcionalidad
```

### Mensajes de Commit

```
feat: nueva funcionalidad
fix: corregir error
docs: actualizar documentación
style: formatear código
refactor: reestructurar código
perf: mejorar performance
test: agregar tests
chore: tarea de mantenimiento
```

---

## 🔐 Autenticación

### Tokens JWT

```typescript
// Obtener token desde API
const { data } = await api.post('/auth/login', { email, password });
const { token } = data;

// Guardar token en localStorage
localStorage.setItem('token', token);

// Usar token en requests
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
```

### Roles de Usuario

```typescript
enum UserRole {
    ADMIN = 'Admin',
    GESTOR = 'Gestor',
    MIEMBRO = 'Miembro'
}
```

### Decoradores de Auth

```typescript
// Controller
@Controller('trabajos')
@UseGuards(JwtAuthGuard)
export class TrabajosController {}

// Método específico
@Get()
@Roles(UserRole.ADMIN, UserRole.GESTOR)
async findAll() {}

// Obtener usuario actual
@Get('profile')
getCurrentUser(@CurrentUser() user: CurrentUserPayload) {
    return user;
}
```

---

## 📊 Database

### Migraciones

```bash
cd backend

# Crear nueva migración
npm run migration:generate

# Ejecutar migraciones pendientes
npm run migration:run

# Revertir última migración
npm run migration:revert

# Ver migraciones
ls src/migrations/
```

### Seed de Datos

```sql
-- Ver archivos en init-scripts/
init-scripts/01-init.sql
```

### Conexión a BD

```bash
# Directo con Docker
docker exec -it aegg-postgres psql -U postgres -d appdb

# Con pgAdmin
# Abre navegador a http://localhost:8080
# Email: admin@aegg.com
# Password: admin
```

---

## 🧪 Tests

### Backend (NestJS)

```bash
cd backend

# Ejecutar todos los tests
npm test

# Ejecutar en watch mode
npm run test:watch

# Ejecutar en debug mode
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend (Vitest)

```bash
cd frontend

# Ejecutar todos los tests
npm test

# Ejecutar test específico
npm test path/to/test.test.tsx

# Coverage
npm test -- --coverage
```

### Ejemplo de Test (Frontend)

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MyComponent from '../MyComponent';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

describe('MyComponent', () => {
    it('renders correctly', () => {
        render(<MyComponent />);
        expect(screen.getByText('Hello')).toBeInTheDocument();
    });
});
```

---

## 📖 Conveniones de Código

### TypeScript

```typescript
// Usar interfaces para objetos
interface User {
    id: string;
    email: string;
}

// Usar type aliases para unions/primitivos
type Status = 'active' | 'inactive';

// Evitar any, usar unknown si es necesario
function parse(data: unknown): Result { }

// Usar enums para valores fijos
enum UserRole {
    ADMIN = 'Admin',
    GESTOR = 'Gestor'
}
```

### React

```typescript
// Componentes funcionales con hooks
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
    return <div>{prop1}</div>;
};

// Hooks con prefijo 'use'
const useCustomHook = () => { };

// Destructurar props
const Component = ({ title, onClick }: Props) => { };
```

### NestJS

```typescript
// Inyección de dependencias en constructor
constructor(private readonly service: MyService) { }

// DTOs para validación
export class CreateDto {
    @IsEmail()
    email: string;
}

// Exceptions de NestJS
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
```

---

## 🐛 Debugging

### Backend

```bash
# Habilitar modo debug
cd backend
npm run start:debug

# Conectar con debugger (VS Code)
# Presiona F5 con breakpoints
```

### Frontend

```bash
# Chrome DevTools
# Abre browser y presiona F12

# React DevTools
# Instala extension de Chrome
```

### Logs

```bash
# Backend logs
pm2 logs aegg-backend --lines 100

# PostgreSQL logs
docker logs aegg-postgres

# Frontend console
# Abre DevTools > Console en browser
```

---

## 🚀 Pull Requests

### Checklist Antes de PR

- [ ] Código compilado sin errores
- [ ] Tests pasando
- [ ] Linting sin warnings
- [ ] Documentación actualizada
- [ ] Mensajes de commit descriptivos
- [ ] Cambios breaking documentados

### Template de PR

```markdown
## Descripción
Breve descripción de los cambios

## Cambios
- Feature: descripción
- Fix: descripción

## Tests
Describe tests agregados

## Screenshots
Agrega screenshots si aplica

## Checklist
- [ ] Tests pasan
- [ ] Documentación actualizada
```

---

**Última actualización**: 27/12/2025
**Versión**: 2.0.0
**Estado**: ✅ Actualizado

# AGENTS.md - Development Guidelines

This document provides essential guidelines for agentic coding agents working in this repository.

## Build/Lint/Test Commands

### Backend (NestJS + TypeScript)
```bash
cd backend
npm run build              # Compile TypeScript to dist/
npm run start              # Run compiled code
npm run start:dev          # Watch mode with hot reload
npm run start:debug        # Debug mode with watch
npm run start:prod         # Production mode
```

### Frontend (React + Vite)
```bash
cd frontend
npm run dev                # Start dev server on port 5173
npm run build              # Build for production
npm run preview            # Preview production build
npm test                   # Run all tests (Vitest)
npm test -- path/to/test   # Run single test file
```

### Database
```bash
# Start PostgreSQL with Docker
docker-compose up -d postgres
docker exec aegg-postgres pg_isready -U postgres -d appdb

# Connection details
Host: localhost, Port: 5440 (Docker), 5432 (internal)
Database: appdb, User: postgres, Password: postgres
```

## Code Style Guidelines

### Backend (NestJS)

**File Structure:**
- Controllers: `feature-name/controllers/*.controller.ts`
- Services: `feature-name/services/*.service.ts`
- Entities: `feature-name/entities/*.entity.ts`
- DTOs: `feature-name/dto/*.dto.ts`
- Guards: `auth/guards/*.guard.ts`
- Decorators: `auth/decorators/*.decorator.ts`

**NestJS Patterns:**
- Use decorators: `@Controller()`, `@Get()`, `@Post()`, `@Injectable()`
- Constructor injection for dependencies
- TypeORM entities with decorators: `@Entity()`, `@Column()`, `@PrimaryGeneratedColumn('uuid')`
- Use `@UseGuards(JwtAuthGuard, RolesGuard)` and `@Roles(UserRole.ADMIN)` for auth
- Return types: Use interfaces or entity types, never `any`
- Error handling: Throw NestJS exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`)

**Imports Order:**
1. NestJS imports
2. TypeORM imports
3. Other external libraries
4. Internal module imports (entities, DTOs, services)

**Example Controller:**
```typescript
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';
import { CreateTrabajoDto } from './dto/create-trabajo.dto';
import { TrabajosService } from './services/trabajos.service';

@Controller('trabajos')
@UseGuards(JwtAuthGuard)
export class TrabajosController {
    constructor(private readonly trabajosService: TrabajosService) { }

    @Get()
    async findAll() { }

    @Post()
    async create(@Body() dto: CreateTrabajoDto, @CurrentUser() user: CurrentUserPayload) { }
}
```

**Entity Pattern:**
```typescript
@Entity('table_name')
@Index('IDX_name', ['column'], { unique: true })
export class EntityName {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    fieldName: string;

    @CreateDateColumn()
    createdAt: Date;
}
```

**DTO Validation:**
```typescript
export class CreateDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;
}
```

### Frontend (React + TypeScript)

**File Structure:**
- Pages: `src/pages/*.tsx`
- Components: `src/components/feature-name/*.tsx`
- Features: `src/features/feature-name/components/*.tsx`
- Services: `src/services/*.ts`
- Types: `src/types/*.ts`
- Tests: `**/__tests__/*.test.tsx`

**React Patterns:**
- Functional components with hooks (no class components)
- Use `React.FC<PropsType>` for component type
- Destructure props in function signature
- Use Tailwind CSS for styling (no inline styles)
- Use Lucide React for icons
- Services handle API calls, components handle UI

**Imports Order:**
1. React imports
2. External libraries (react-router-dom, lucide-react, etc.)
3. Internal types
4. Internal services
5. Internal components (relative paths)
6. Styles (if needed)

**Example Component:**
```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Trabajo } from '../../types/trabajo';
import { trabajosService } from '../../services';

interface Props {
    trabajo: Trabajo;
    onEdit: () => void;
}

export const ComponentName: React.FC<Props> = ({ trabajo, onEdit }) => {
    const [state, setState] = useState<string>('');
    const navigate = useNavigate();

    useEffect(() => {
        // side effects
    }, []);

    return <div className="p-4">{/* JSX */}</div>;
};
```

**Service Pattern:**
```typescript
export const serviceName = {
    async getAll(params?: any): Promise<Type[]> {
        const { data } = await api.get('/endpoint', { params });
        return data;
    },

    async create(payload: CreateDto): Promise<Type> {
        const { data } = await api.post('/endpoint', payload);
        return data;
    },
};
```

## TypeScript Guidelines

**Types:**
- Use interfaces for object shapes
- Use type aliases for unions, primitives, function types
- Export types from dedicated files: `src/types/*.ts`
- Use enums for fixed sets of values: `export enum UserRole { ADMIN = 'Admin', ... }`

**Type Safety:**
- Avoid `any` - use `unknown` or specific types
- Use optional chaining `?.` and nullish coalescing `??`
- Type assertions only when necessary: `as Type`

**Backend Types:**
```typescript
export interface CurrentUserPayload {
    userId: string;
    email: string;
    role: UserRole;
}
```

**Frontend Types:**
```typescript
export interface Trabajo {
    id: string;
    clienteNombre?: string;
    estado: EstadoTrabajo;
}
```

## Naming Conventions

**Files:**
- Kebab-case for files: `user-service.ts`, `trabajo-detail.tsx`
- Test files: `*.test.tsx` or `*.spec.ts`

**Backend:**
- Classes: PascalCase: `TrabajosService`, `AuthController`
- Methods: camelCase: `findAll()`, `createTrabajo()`
- Variables: camelCase: `const userRepository`, `const userId`
- Constants: UPPER_SNAKE_CASE: `const MAX_ATTEMPTS = 3`
- Entities: PascalCase: `@Entity('users') export class User {}`

**Frontend:**
- Components: PascalCase: `const TrabajoDetail: React.FC<Props> = ...`
- Hooks: camelCase starting with 'use': `const useAuth = () => {}`
- Variables: camelCase: `const [mesSeleccionado, setMesSeleccionado]`
- Functions: camelCase: `const handleEdit = () => {}`

## Error Handling

**Backend:**
```typescript
// Always throw NestJS exceptions
throw new NotFoundException('User not found');
throw new BadRequestException('Invalid input');
throw new ForbiddenException('Not authorized');

// Log important operations
this.logger.log(`Creating trabajo for user ${currentUser.userId}`);
```

**Frontend:**
```typescript
// Use try/catch for async operations
try {
    await trabajosService.create(dto);
} catch (error) {
    console.error('Error creating trabajo:', error);
    alert('Failed to create trabajo');
}

// Validate before API calls
if (!dto.email) {
    return alert('Email is required');
}
```

## Authentication

**Backend:**
- Use `@CurrentUser()` decorator to get authenticated user
- Apply `@UseGuards(JwtAuthGuard)` to protected routes
- Use `@Roles(UserRole.ADMIN, UserRole.GESTOR)` for role-based access
- JWT token includes: `sub, email, role, equipoId`

**Frontend:**
- Token stored in `localStorage.getItem('token')`
- API interceptor adds `Authorization: Bearer {token}` header
- Use `AuthContext` for auth state: `const { user, login, logout } = useAuth()`
- Wrap protected routes with `<PrivateRoute />`

## Database

**Entity Relationships:**
- Use `@ManyToOne`, `@OneToMany`, `@OneToOne` decorators
- Specify `@JoinColumn({ name: 'foreign_key' })` for owning side
- Use JSONB columns for flexible data: `@Column('jsonb', { default: {} })`

**Migrations:**
- Located in `backend/src/migrations/`
- Run with TypeORM CLI or create manually
- Always use UUID for primary keys: `@PrimaryGeneratedColumn('uuid')`

## Testing (Frontend Vitest)

**Test Structure:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ComponentName from '../ComponentName';

vi.mock('../services', () => ({ service: { method: vi.fn() } }));

describe('ComponentName', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly', () => {
        render(<ComponentName />);
        expect(screen.getByText('Expected Text')).toBeInTheDocument();
    });
});
```

**Run Single Test:**
```bash
cd frontend
npm test path/to/test.test.tsx
```

## Common Patterns

**Async/Await:**
```typescript
// Backend
async methodName(): Promise<ReturnType> {
    const result = await this.repository.findOne({ where: { id } });
    if (!result) throw new NotFoundException();
    return result;
}

// Frontend
useEffect(() => {
    const fetchData = async () => {
        try {
            const data = await service.getAll();
            setState(data);
        } catch (error) {
            console.error(error);
        }
    };
    fetchData();
}, []);
```

**Form Handling:**
```typescript
// Backend DTO validation with class-validator
// Frontend form state with controlled components
const [formData, setFormData] = useState({ email: '', password: '' });
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
};
```

## Environment Variables

**Backend (.env):**
```
DATABASE_HOST=localhost
DATABASE_PORT=5440
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=appdb
JWT_SECRET=change_this_in_production
NODE_ENV=development
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000
```

## Important Notes

- PostgreSQL runs in Docker on port 5440 (mapped from 5432)
- Backend runs on port 3000, Frontend on 5173
- CORS is configured for localhost:5173-5176 and https://aegg.creapolis.mx
- JWT tokens expire in 7 days
- TypeORM synchronize is enabled in development, disabled in production
- Always run `npm run build` before testing production builds

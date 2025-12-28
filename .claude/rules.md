# Project Rules - Sistema de Gestión de Trabajos Contables V2

**Reglas mandatorias para todos los agentes trabajando en este proyecto.**

## 📋 Table of Contents

1. [Architecture Rules](#architecture-rules)
2. [Code Quality Rules](#code-quality-rules)
3. [Testing Rules](#testing-rules)
4. [UI/UX Rules](#uiux-rules)
5. [Security Rules](#security-rules)
6. [Documentation Rules](#documentation-rules)

---

## 🏗️ Architecture Rules

### Project Structure

```
aegg-new-app/
├── backend/                    # NestJS Backend (TypeORM + PostgreSQL)
│   ├── src/
│   │   ├── auth/              # JWT Authentication
│   │   ├── clientes/          # Client CRUD
│   │   ├── trabajos/          # Core: Trabajos, Meses, Reportes
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   ├── users/             # User management
│   │   ├── knowledge-base/    # KB endpoints
│   │   ├── common/            # Helpers, decorators
│   │   └── main.ts
│   └── package.json
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # React components (shared)
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API client (axios)
│   │   ├── context/          # Auth context
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── docs/                       # Documentation
└── docker-compose.yml          # PostgreSQL + pgAdmin
```

### Backend Architecture (NestJS)

**Layers:**
```
Controller (HTTP) → Service (Business Logic) → Repository (Data)
     ↓                    ↓                          ↓
  DTOs & Validation    Domain Entities          TypeORM
```

**Module Organization:**
- Feature-based modules (`auth/`, `trabajos/`, `clientes/`)
- Each module has: `controllers/`, `services/`, `entities/`, `dto/`
- Services inject repositories via `@InjectRepository()`
- Controllers use `@UseGuards(JwtAuthGuard)` for protected routes

### Frontend Architecture (React)

**Component Organization:**
```
Page/Route → Container Component → UI Component
     ↓              ↓                      ↓
  API calls   TanStack Query         Pure UI
  (services)   (data fetching)       (components/)
```

**Routing:**
- React Router DOM 6.21
- Route-based code splitting
- Protected routes with `PrivateRoute` component

---

## ✅ Code Quality Rules

### TypeScript Strict Mode

**ALL code MUST:**
- Enable `strict: true` in `tsconfig.json`
- NO `any` types without compelling reason
- Proper interface/type exports
- Type all function parameters and return values

```typescript
// ✅ CORRECT
interface TrabajoProps {
  id: string;
  clienteNombre: string;
  anio: number;
  onEdit: (id: string) => void;
}

// ❌ WRONG
interface TrabajoProps {
  id: any;
  clienteNombre: any;
}
```

### Error Handling

**Backend (NestJS):**
```typescript
// ✅ CORRECT: Use NestJS built-in exceptions
throw new BadRequestException('clienteId es requerido');
throw new UnauthorizedException();
throw new NotFoundException('Trabajo no encontrado');
throw new ForbiddenException('No tienes permiso');

// ❌ WRONG: Generic errors
throw new Error('Algo salió mal');
```

**Frontend (React):**
```typescript
// ✅ CORRECT: Handle errors gracefully
const { error, data } = useTrabajos();
if (error) {
  return <ErrorState message={error.message} />;
}
if (isLoading) return <LoadingSpinner />;
```

### Naming Conventions

- **Files**: `kebab-case.ts` or `kebab-case.tsx`
- **Components**: `PascalCase`
- **Functions/Variables**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Private properties**: `_camelCase`

```typescript
// ✅ CORRECT
const MAX_UPLOAD_SIZE = 1048576; // 1MB
interface TrabajoCardProps { }
export function TrabajoCard() { }
private _logger: Logger;

// ❌ WRONG
const maxSize = 1048576;
interface trabajoCardProps { }
export function trabajoCard() { }
```

---

## 🧪 Testing Rules

### Test Coverage Requirements

**Minimum Coverage:**
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

**Critical Paths (100% Required):**
- Authentication & authorization
- Trabajos CRUD operations
- Excel import/processing
- Input validation
- Error handling

### Test Types Required

**For EVERY feature, MUST have:**

1. **Unit Tests** (70%)
   - Pure functions
   - Components in isolation
   - Services, utilities

2. **Integration Tests** (20%)
   - API + Database
   - Component + Services
   - Multiple units working together

3. **E2E Tests** (10%)
   - Critical user flows only
   - Login → Create Trabajo → Import Excel → Process

### Test Quality Gates

**Before completing ANY task:**
```bash
# Backend
cd backend
npm run lint           # ✅ Zero errors, zero warnings
npm run test           # ✅ All tests pass
npm run build          # ✅ Zero build errors

# Frontend
cd frontend
npm run lint           # ✅ Zero errors, zero warnings
npm run test           # ✅ All tests pass
npm run build          # ✅ Zero build errors
```

---

## 🎨 UI/UX Rules

### NO Transparencies (Strict)

**Backgrounds MUST be solid colors:**
```css
/* ✅ CORRECT: Solid colors */
background-color: #ffffff;
background-color: #f3f4f6;
background: rgb(255, 255, 255);

/* ❌ WRONG: Transparencies */
background-color: rgba(255, 255, 255, 0.5);
background: rgba(0, 0, 0, 0.1);
opacity: 0.9;
```

**Exception:** Only for disabled states with solid backing

### NO Gradients (Strict)

**Backgrounds MUST be solid:**
```css
/* ✅ CORRECT: Solid color */
background-color: #3b82f6;

/* ❌ WRONG: Gradients */
background: linear-gradient(90deg, #3b82f6, #8b5cf6);
```

### Perfect Responsiveness (Mandatory)

**ALL components MUST support:**
- **Mobile**: 320px - 640px
- **Tablet**: 641px - 1024px
- **Desktop**: 1025px+

```tsx
// ✅ CORRECT: Mobile-first responsive design
<div className="
  grid
  grid-cols-1          /* Mobile: 1 column */
  md:grid-cols-2       /* Tablet: 2 columns */
  lg:grid-cols-3       /* Desktop: 3 columns */
  gap-4
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Accessibility (WCAG AA)

**ALL UI components MUST:**
1. **Keyboard Navigation**: All interactive elements accessible via Tab
2. **ARIA Labels**: All buttons, inputs have aria-label or visible text
3. **Color Contrast**: Minimum 4.5:1 for text
4. **Focus Indicators**: Visible focus outline
5. **Semantic HTML**: Correct headings, landmarks

```tsx
// ✅ CORRECT: Accessible button
<button
  type="button"
  onClick={handleClick}
  aria-label="Cerrar diálogo"
  className="focus:ring-2 focus:ring-blue-500"
>
  <XIcon />
</button>
```

### Dark Mode Support

**ALL components MUST support dark mode:**

```tsx
// ✅ CORRECT: Dark mode classes
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content that works in both light and dark mode
</div>
```

---

## 🔒 Security Rules

### Input Validation

**ALL user input MUST be validated:**

```typescript
// ✅ CORRECT: Backend validation with class-validator
export class CreateTrabajoDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  clienteNombre: string;

  @IsInt()
  @Min(2000)
  @Max(2100)
  anio: number;
}
```

### Authentication & Authorization

**Backend:**
- ✅ All endpoints protected by `@UseGuards(JwtAuthGuard)`
- ✅ Public endpoints marked with `@Public()`
- ✅ Authorization checks (user owns resource)

```typescript
// ✅ CORRECT
@Controller('trabajos')
@UseGuards(JwtAuthGuard)
export class TrabajosController {
  @Get()
  findAll(@CurrentUser() user: CurrentUserPayload) {
    // Filter by user role and permissions
    return this.trabajosService.findAll(user);
  }
}
```

### Environment Variables

**Secrets MUST be in environment variables:**
- ✅ `DATABASE_URL`
- ✅ `JWT_SECRET`
- ❌ NEVER hardcoded in code

---

## 📚 Documentation Rules

### JSDoc Comments

**ALL exported functions MUST have JSDoc:**

```typescript
/**
 * Crea un nuevo trabajo contable
 *
 * @param dto - Datos del trabajo con validación
 * @param currentUser - Usuario autenticado que crea el trabajo
 * @returns El trabajo creado con ID generado
 *
 * @throws {BadRequestException} Si la validación falla
 * @throws {NotFoundException} Si el cliente no existe
 *
 * @example
 * ```typescript
 * const trabajo = await createTrabajo(
 *   { clienteNombre: 'Empresa ABC', anio: 2025 },
 *   { userId: 'user-123', role: UserRole.GESTOR }
 * );
 * ```
 */
async function createTrabajo(
  dto: CreateTrabajoDto,
  currentUser: CurrentUserPayload
): Promise<Trabajo>
```

### API Documentation

**Backend APIs MUST have:**
- All endpoints documented with `@ApiOperation()`
- Request/response schemas with DTOs
- Error codes documented
- Swagger UI at `/api-docs`

```typescript
// ✅ CORRECT
@Post()
@ApiOperation({ summary: 'Crear un nuevo trabajo' })
@ApiResponse({ status: 201, type: Trabajo })
@ApiResponse({ status: 400, description: 'Validation error' })
async create(
  @Body() dto: CreateTrabajoDto,
  @CurrentUser() user: CurrentUserPayload
) {
  return this.trabajosService.create(dto, user);
}
```

---

## 🎯 Quality Checklist

Before completing ANY task:

```bash
# Backend
cd backend
npm run lint           # ✅ Zero errors, zero warnings
npm run test           # ✅ 100% tests pass
npm run build          # ✅ Zero build errors

# Frontend
cd frontend
npm run lint           # ✅ Zero errors, zero warnings
npm run test           # ✅ 100% tests pass
npm run build          # ✅ Zero build errors
```

**Additional checks:**
- [ ] Code coverage >80% (100% critical paths)
- [ ] Lighthouse score >90 (for web)
- [ ] Accessibility: 0 violations
- [ ] Bundle size: No regressions
- [ ] Documentation: Complete

---

## 🚫 Forbidden Patterns

### ❌ NEVER Do:

1. **Skip tests**: "I'll add tests later" → NO! Add tests now
2. **Use `any` type**: "It's too complicated" → NO! Create proper types
3. **Hardcode values**: "Just this once" → NO! Use constants or env vars
4. **Copy-paste code**: "It's similar but not the same" → NO! Extract shared logic
5. **Ignore warnings**: "It's just a warning" → NO! Fix it
6. **Push failing tests**: "I'll fix it in the next commit" → NO! All tests must pass
7. **Skip documentation**: "The code is self-explanatory" → NO! Add JSDoc
8. **Use transparencies**: "It looks cool" → NO! Use solid colors
9. **Use gradients**: "It makes it pop" → NO! Use solid colors
10. **Ignore mobile**: "Nobody uses mobile" → NO! Perfect responsiveness required

### ✅ ALWAYS Do:

1. **Write tests first** (TDD when possible)
2. **Type everything** (no implicit any)
3. **Extract shared logic** (components/, services/)
4. **Fix all warnings** (zero tolerance)
5. **Run all tests** before committing
6. **Document code** (JSDoc, examples)
7. **Use solid colors** (no transparencies)
8. **Test on mobile** (320px - 640px)
9. **Check accessibility** (keyboard, screen reader)
10. **Validate performance** (Lighthouse, Web Vitals)

---

## 🎓 Summary

**The Golden Rule:**
> "If it's not tested, it's broken. If it has warnings, fix them. Quality is non-negotiable."

**Agent Motto:**
> "Research → Implement → Test → Validate → Refactor → Document → Repeat until perfect."

**Success Criteria:**
- ✅ All tests pass (100%)
- ✅ Zero type errors
- ✅ Zero linting warnings
- ✅ Coverage >80% (100% critical)
- ✅ All apps build successfully
- ✅ All code documented
- ✅ Perfect responsiveness (mobile, tablet, desktop)
- ✅ Accessibility: WCAG AA compliant
- ✅ Performance: Lighthouse >90
- ✅ No transparencies or gradients

---

**Built with ❤️ for Sistema de Gestión de Trabajos Contables V2**

*Estas reglas aseguran consistencia, calidad y mantenibilidad en todo el proyecto.*

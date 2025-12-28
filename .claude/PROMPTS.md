# Optimized Prompt Templates

**Plantillas de prompts optimizados para tareas comunes.**

## 🎯 Backend (NestJS)

### CRUD API Completo

```
Use nestjs-backend agent to create [Resource] CRUD API:

Pattern Reference: apps/backend/src/tasks/
Location: apps/backend/src/[resources]/
Entity: [EntityName] from @ordo-todo/core

Requirements:
- Controller with REST endpoints (GET, POST, PATCH, DELETE)
- Service with business logic
- Repository using PrismaService
- DTOs with class-validator (Create, Update, Query)
- Unit tests (Jest)
- Integration tests (supertest)
- Swagger documentation
- JSDoc comments

Apply rules from: .claude/rules/backend.md

Quality Gates (must pass):
✅ npm run lint
✅ npm run check-types
✅ npm run test
✅ npm run build
```

### Endpoint Individual

```
Use nestjs-backend agent to create [action] endpoint:

Controller: apps/backend/src/[resources]/[resources].controller.ts
Method: [GET/POST/PATCH/DELETE]
Path: /[resources]/:id/[action]
Auth: JWT required
Validation: class-validator DTO
Response: [Type] entity
Error handling: NestJS built-in exceptions
Docs: Swagger + JSDoc

Reference existing endpoints for patterns.
```

---

## 🎨 Frontend (Next.js)

### Componente UI

```
Use nextjs-frontend agent to create [ComponentName]:

Location: packages/ui/src/components/[domain]/[component].tsx
Pattern Reference: packages/ui/src/components/task/task-card.tsx

Props:
- [propName]: [type] - description
- on[Action]: (id: string) => void - callback
- labels?: { [key]: string } - i18n

Requirements:
- Platform-agnostic (no hooks, no router)
- TypeScript strict types
- Accessibility: WCAG AA (keyboard, ARIA, focus)
- Responsive: mobile (320-640px), tablet (641-1024px), desktop (1025px+)
- Dark mode: dark: variants
- Styling: TailwindCSS (no transparencias, no gradientes)

Tests: React Testing Library
Docs: Storybook + JSDoc

Rules: .claude/rules/packages.md
```

### Server Component (Page)

```
Use nextjs-frontend agent to create [page] page:

Location: apps/web/app/[route]/page.tsx
Type: Server Component

Requirements:
- Fetch data directly (no React Query)
- Pass data to client components as props
- Loading state with loading.tsx
- Error handling with error.tsx
- Responsive layout
- SEO metadata

Tests: Playwright E2E
```

### Client Component (Interactive)

```
Use nextjs-frontend agent to create [Component]:

Location: apps/web/src/components/[domain]/
Type: Client Component ('use client')

Requirements:
- State management: Zustand (local) or React Query (server)
- Data fetching: @ordo-todo/hooks
- Components: @ordo-todo/ui (platform-agnostic)
- i18n: next-intl hook
- Responsive design
- Dark mode support
- Accessibility

Tests: React Testing Library + Playwright
```

---

## 🗄️ Database (Prisma)

### Nueva Tabla

```
Use postgres-specialist agent to design [table] table:

Schema Location: packages/db/prisma/schema.prisma

Requirements:
- Field: id (String, cuid, primary)
- Field: [field1] (type, constraints)
- Field: [field2] (type, constraints)
- Relationships: [related tables]
- Indexes: [query patterns]
- Constraints: unique, foreign key, check

Normalization: 3NF
Performance: Appropriate indexes
Documentation: Comment blocks

Generate: Prisma client after schema change
```

### Migration

```
Use postgres-specialist agent to create migration:

Description: [what changes]
Schema: packages/db/prisma/schema.prisma

Commands:
cd packages/db
npx prisma migrate dev --name [migration_name]
npx prisma generate

Test: Verify data integrity
```

---

## 🧪 Testing

### Unit Tests

```
Use testing-specialist agent to create unit tests:

Target: [file path]
Type: [Service|Component|Hook|Util]

Framework: Jest/Vitest
Coverage target: 100%

Requirements:
- Test all public methods
- Test edge cases
- Test error handling
- Mock external dependencies
- Arrange-Act-Assert pattern
- Clear test names

Location: [file].spec.ts or __tests__/
```

### Integration Tests

```
Use testing-specialist agent to create integration tests:

Target: [API endpoint + Service]
Framework: supertest (NestJS)

Requirements:
- Test database operations
- Test API responses
- Test error cases
- Clean up after each test
- Use test database

Location: apps/backend/src/[domain]/[domain].e2e-spec.ts
```

### E2E Tests

```
Use testing-specialist agent to create E2E tests:

Target: [user flow]
Framework: Playwright

Requirements:
- Test critical path only
- Test happy path
- Test error cases
- No hardcoded waits
- Deterministic selectors

Scenario:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Location: apps/web/e2e/[feature].spec.ts
```

---

## 📚 Documentation

### API Documentation

```
Use documentation-specialist agent to document [feature]:

Components:
- OpenAPI/Swagger spec
- Endpoint descriptions
- Request/response schemas
- Error codes
- Usage examples
- Authentication requirements

Output: Update Swagger in backend code
```

### Component Documentation

```
Use documentation-specialist agent to document [component]:

Components:
- JSDoc comments (all props, methods)
- Storybook stories (all variants)
- Usage examples
- Props table
- Accessibility notes
- Responsive breakpoints

Location: Component file + .stories.tsx
```

### README

```
Use documentation-specialist agent to create README:

Target: [package or app]

Sections:
- Description
- Installation
- Usage examples
- API reference
- Contributing
- License

Location: README.md in target directory
```

---

## 🔄 Refactoring

### Código Legacy

```
Use refactoring-specialist agent to refactor [code]:

Target: [file path]
Issues: [describe problems]

Goals:
- Apply SOLID principles
- Eliminate code smells
- Improve type safety
- Add error handling
- Improve performance
- Add tests

Maintain: Same functionality
Improve: Code quality

Rules: .claude/rules.md#code-quality-rules
```

---

## 🚀 Feature Completa

### Full-Stack Feature

```
Create [feature] end-to-end:

1️⃣ DATABASE (postgres-specialist):
   - Design tables in packages/db/prisma/schema.prisma
   - Create migration
   - Generate Prisma client

2️⃣ BACKEND (nestjs-backend):
   - Create CRUD API in apps/backend/src/[feature]/
   - DTOs with validation
   - Service with domain entities
   - Tests (unit + integration)
   - Swagger docs

3️⃣ FRONTEND (nextjs-frontend):
   - Create components in packages/ui/src/components/[feature]/
   - Create pages in apps/web/app/[feature]/
   - Create hooks in packages/hooks/src/[feature].ts
   - Responsive design
   - Dark mode
   - Accessibility

4️⃣ TESTS (testing-specialist):
   - Unit tests (all components)
   - Integration tests (API)
   - E2E tests (user flow)

5️⃣ DOCS (documentation-specialist):
   - API documentation (Swagger)
   - Component documentation (Storybook)
   - JSDoc comments
   - README updates

Quality Gates (all must pass):
✅ npm run lint (0 errors, 0 warnings)
✅ npm run check-types (0 errors)
✅ npm run test (100% pass)
✅ npm run build (success)
```

---

## 🎯 Quick Prompts (Copia & Pega)

### Backend rápido
```
Use nestjs-backend agent: create [resource] CRUD following tasks/ pattern
```

### Frontend rápido
```
Use nextjs-frontend agent: create [Component] in packages/ui following TaskCard pattern
```

### Tests rápido
```
Use testing-specialist agent: test [feature] with 100% coverage
```

### Docs rápido
```
Use documentation-specialist agent: document [feature] with Swagger + JSDoc
```

### Bug fix rápido
```
Use [specialist] agent to fix [error] in [file]
Error: [paste error]
Use sequential-thinking for analysis
```

---

## 💡 Tips de Uso

### 1. Ser Específico

❌ "Create something for projects"
✅ "Create ProjectCard component in packages/ui following TaskCard pattern"

### 2. Referencias Claras

❌ "Like the other thing"
✅ "Follow pattern in apps/backend/src/tasks/tasks.controller.ts"

### 3. Requerimientos Explícitos

❌ "Make it good"
✅ "Include: accessibility, responsive design, dark mode, tests, docs"

### 4. Calidad Gates

❌ "Create the feature"
✅ "Create feature, ensure all tests pass, then document"

### 5. Ubicación Precisa

❌ "Create component"
✅ "Create in packages/ui/src/components/project/project-card.tsx"

---

## 🎯 Formato de Prompts

### Estructura Ideal

```
[AGENTE] + [TAREA] + [REFERENCIA] + [REQUISITOS] + [UBICACIÓN] + [REGLAS]

Ejemplo:
Use nestjs-backend agent to create Projects CRUD API
following tasks pattern (apps/backend/src/tasks/)
with controller, service, DTOs, tests, Swagger docs
in apps/backend/src/projects/
applying .claude/rules/backend.md
```

### Corto y Preciso

```
[Qué] + [Dónde] + [Cómo] + [Referencias]

Ejemplo:
Create ProjectCard in packages/ui
following TaskCard pattern
with accessibility, responsive, dark mode
```

---

## 📊 Métricas de Éxito

### Prompt Optimo

- ⏱️ **< 30 segundos** de leer
- 🎯 **3-5 líneas** de contexto
- 📍 **1-2 referencias** a archivos
- ✅ **1 agente** especialista
- 📋 **Requisitos** numéricos (100% coverage, etc)

### Resultado

- 🚀 Implementación correcta
- ✅ Tests passing
- 📚 Docs completas
- 🎯 Sin necesidad de revisions

---

**Built with ❤️ for Ordo-Todo**

*Usa estos templates para máximo efficiency*
